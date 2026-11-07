Ext.define('SamosAdminModern.login.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.login',
    
    init: function() {
        this.redirectTo('login');
    },

    onLoginClick: async function(btn) {
        const view = this.getView();

        try {
            const vm    = this.getViewModel();
            const store = vm.getStore('permissoes');
            const login = this.lookup('txtlogin').getValue();
            const senha = this.lookup('txtsenha').getValue();
    
            if(!login) {
                this.lookup('txtlogin').focus(true);
                throw 'Preencha o usuário';
            } else if (!senha) {
                this.lookup('txtsenha').focus(true);
                throw 'Preencha a senha';
            }
    
            view.initGauge();

            function encriptString( text, key=[2, 8, 2, 4, 1, 1, 1, 4, 5, 6, 0, 1, 3, 5, 4, 3] ){
                // Convert text to bytes
                var textBytes = aesjs.utils.utf8.toBytes(text);
                 
                // The counter is optional, and if omitted will begin at 1
                var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
                var encryptedBytes = aesCtr.encrypt(textBytes);
                 
                // To print or store the binary data, you may convert it to hex
                var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
                return encryptedHex;
            }

            const senhaCriptografada = encriptString(senha);
    
            const queryAuth = await SamosUtils.Request.nodeApi({
                url: `/auth`,
                method: 'GET',
                query: {
                    login: encodeURIComponent(login),
                    senha: encodeURIComponent(senhaCriptografada),
                    loginCase: configs.getLogin().case,
                    acessos: configs.getUsuarios().acessosSimultaneos,
                    device: 'phone',
                    sessionId: sessionStorage.getItem(Object.keys(Ext.app.namespaces)[1] + 'SessionID')
                }
            });

            SamosAdminModern.sessionInterval = queryAuth.results[3];

            localStorage.setItem(Object.keys(Ext.app.namespaces)[1] + 'UserToken', queryAuth.results[0]);
            
            store.getProxy().setExtraParams({
                pessoa: queryAuth.results[1]
            });

            const permissoes = await store.load();
            this.onLoginSuccess(permissoes);

        } catch(error) {
            console.log(error)
            SamosUtils.Msg.error(error, 'Falha ao fazer login')
        }
        
        view.stopGauge(true);
    },

    onLoginSuccess: function (records) {
        const permissoes = records.filter(item => SamosUtils.Json.tryJsonToObj(item.get('PERMISSOES_ITENS')));

        if (permissoes[0]) {
            if(SamosAdminModern.sessionInterval > 0) {
                this.iniciarTimerChecagemSessao();
                this.tentarDeletarSessaoAoSair();
            }
            this.selecionarEmpresaPadrao(permissoes);
            this.getViewModel().set({ 'unlogged': false });
        } else {
            SamosUtils.Msg.alert('Atenção', 'Usuário sem permissões em nenhuma empresa');
            this.onVoltarClick();
        }
        this.getView().stopGauge();
    },

    iniciarTimerChecagemSessao: function() {
        SamosAdminModern.sessionInterval = setInterval(() => {
            jQuery.ajax({
                url: configs.getApiNode() + '/session',
                type: 'POST',
                headers: {
                    sessionid: sessionStorage.getItem(Object.keys(Ext.app.namespaces)[1] + 'SessionID'),
                    device: 'phone',
                    userid: configs.getUsuario().id
                }
            });
        }, 5000);
    },

    tentarDeletarSessaoAoSair: function() {
        if(!document.addEventListener && document.attachEvent) {
            window.attachEvent('onbeforeunload', this.deletarSessao());
        } else {
            window.addEventListener('beforeunload', this.deletarSessao());
        }

        window.onbeforeunload = this.deletarSessao();
    },

    deletarSessao: function() {
        const ajax = jQuery.ajax;
        const obj = {
            url: configs.getApiNode() + '/session',
            type: 'DELETE',
            headers: {
                sessionid: sessionStorage.getItem(Object.keys(Ext.app.namespaces)[1] + 'SessionID')
            }
        };

        return function() {
            ajax(obj);
        }
    },

    selecionarEmpresaPadrao: function (permissoes) {
        const combo = this.lookup('empresas');

        const defaultCompany = permissoes.filter(rec => {
            return rec.get(`EMPRESAS_ID`) == rec.get('USUARIOS_ID_EMPRESAS');
        });

        combo.select(defaultCompany[0] || 0);
        combo.fireEvent('select', combo, combo.getSelection());
        Ext.defer(combo.focus, 100, combo);
    },

    onLoginFailure: function (response, store) {
        const txtUser = this.lookup('usuarioField');

        if(response.status == 401) { 
            SamosUtils.Msg.alert('Login', response.responseJson.error);
        } else {
            console.error(response.stack);
            SamosUtils.Msg.alert('Erro', 'Erro no servidor');
        }
        this.getView().stopGauge();
        Ext.defer(txtUser.focus, 100, txtUser, [true]);
    },

    onEntrarClick: async function (btn) {
        const permissao  = this.lookup('empresas').getSelection();
        const cnpj       = permissao.get('EMPRESAS_CPFCNPJ');
        const permissoes = JSON.parse(permissao.get('PERMISSOES_ITENS') || '{}');

        console.log(permissoes);

        const menu = [];

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Atualização').children) {
                if(p.text == 'Pessoas') {
                    menu.push({ 
                        "text"   : "Pessoas", 
                        "module" : "pessoas", 
                        "read"   : p.read == 'T',
                        "create" : false,
                        "update" : p.update == 'T',
                        "destroy": p.destroy == 'T'
                    })
                }
            }
        } catch (e) {}

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Atualização').children) {
                if(p.text == 'Usuários') {
                    menu.push({ 
                        "text"   : "Usuários", 
                        "module" : "usuarios", 
                        "read"   : p.read == 'T',
                        "create" : false,
                        "update" : p.update == 'T',
                        "destroy": p.destroy == 'T'
                    })
                }
            }
        } catch (e) {}

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Atualização').children) {
                if(p.text == 'Produtos') {
                    menu.push({ 
                        "text"   : "Produtos", 
                        "module" : "produtos", 
                        "read"   : p.read == 'T',
                        "create" : false,
                        "update" : false,
                        "destroy": false
                    })
                }
            }
        } catch (e) {}

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Movimentos').children) {
                if(p.text == 'Orçamentos') {
                    menu.push({ 
                        "text"   : "Orçamentos", 
                        "module" : "orcamentos", 
                        "read"   : p.read == 'T',
                        "create" : p.create == 'T',
                        "update" : p.update == 'T',
                        "destroy": p.destroy == 'T'
                    })
                }
            }
        } catch (e) {}

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Movimentos').children) {
                if(p.text == 'Pedidos') {
                    menu.push({ 
                        "text"   : "Pedidos", 
                        "module" : "pedidos", 
                        "read"   : p.read == 'T',
                        "create" : p.create == 'T',
                        "update" : p.update == 'T',
                        "destroy": p.destroy == 'T'
                    })
                }
            }
        } catch (e) {}

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Movimentos').children) {
                if(p.text == 'Nota Eletrônica') {
                    menu.push({ 
                        "text"   : "Nota Eletrônica", 
                        "module" : "notaeletronica", 
                        "read"   : p.read == 'T',
                        "create" : p.create == 'T',
                        "update" : p.update == 'T',
                        "destroy": p.destroy == 'T'
                    })
                }
            }
        } catch (e) {}

        try {
            for (let p of permissoes.children.find(n1 => n1.text == 'Financeiro').children) {
                if(p.text == 'Boletos') {
                    menu.push({ 
                        "text"   : "Boletos", 
                        "module" : "receber", 
                        "read"   : p.read == 'T',
                        "create" : p.create == 'T',
                        "update" : p.update == 'T',
                        "destroy": p.destroy == 'T'
                    })
                }
            }
        } catch (e) {}

        menu.push({ 
            "text"   : "Notificação", 
            "module" : "notificacao", 
            "read"   : true
        });

        const imageURL = await SamosUtils.Request.getClientImage(cnpj, 'main');

        const main = Ext.$('main')[0];
        const view = this.getView();

        main.down('image[reference="logo"]').setSrc(imageURL);

        this.redirectTo('menu');
        this.setGlobalConfigs(permissao);
        main.getViewModel().set({
            menu: JSON.stringify(menu),
            dataPermissoes: this.getViewModel().getStore('permissoes').data.items
        });

        view.stopGauge();
        view.up('main').down('panel').setActiveItem('menulist');
        view.up('main').down('container[reference="title"]').setHtml('Menu');
        
        this.getDataHoraServidor();
        Notificacao.services.Monitor.init();
    },

    setGlobalConfigs: function (permissao) {
        const empresa = this.lookup('empresas').getSelection();

        configs.set({
            usuario: { 
                id          : permissao.get('USUARIOS_ID'),
                nome        : permissao.get('USUARIOS_NOME'),
                login       : permissao.get('USUARIOS_LOGIN'),
                tipo:         permissao.get('USUARIOS_TIPO'),
                cpfcnpj:      permissao.get('USUARIOS_CPFCNPJ'),
                privilegiado: permissao.get('USUARIOS_PRIVILEGIADO') == 'T' || permissao.get('USUARIOS_PRIVILEGIADO') == '0',
                tempo:        (permissao.get('USUARIOS_TEMPO') || 5) * 60
            },
            empresa: {
                id              : empresa.data.EMPRESAS_ID,
                nome            : empresa.data.EMPRESAS_FANTASIA,
                numeroultimanota: empresa.data.EMPRESAS_NUMEROULTIMANOTA,
                serieultimanota : empresa.data.EMPRESAS_SERIEULTIMANOTA,
                custo           : empresa.data.EMPRESAS_CUSTO,
                cidade          : empresa.data.CIDADES_NOME,
                estado          : empresa.data.CIDADES_ESTADO
            },
            permissao: permissao.data
        });
    },

    getDataHoraServidor: async function () {
        try {
            const queryDataHora = await SamosUtils.Request.nodeApi({
                url: `/datetime`,
                method: 'GET'
            });

            window.momentServer = momentTz.bind(window, queryDataHora);
        } catch(error) {
            window.momentServer = momentTz.bind(window, momentTz().utc().format());
        }
        
        //a cada 15m atualiza a hora pelo servidor
        setTimeout(() => {
            this.getDataHoraServidor();
        }, 15 * 60 * 1000);
    },

    onSairClick: function () {
        location.href = `${location.origin}${location.pathname}resources/sessaoencerrada.html`;
    },

    doDefaultFocus: Ext.emptyFn
});
