Ext.define('SamosAdmin.atualizacao.usuarios.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formusuarios',
    
    //se apagar o CEP, sao sair do campo, ele limpar os dados do endereço automaticamente
    onSairCampoCep: function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model'),
              cepBuscando = campo.getRawValue().replace(/\D/ig, '');

        if( !vm.get('readOnly') && cepBuscando == '' ){
            //Limpa os campos pra evitar confusao
            model.set({
                'USUARIOS_ID_CIDADES' : '',
                'CIDADES_NOME'        : '',
                'CIDADES_ESTADO'      : '',
                'CIDADES_IBGE'        : '',
                'USUARIOS_ENDERECO'   : '',
                'USUARIOS_BAIRRO'     : ''
            });
        }
    },

    onNovoClick: async function() {
        if(configs.getUsuarios().maxUsuariosCadastrados) {
            const queryUsuariosCadastrados = await SamosUtils.Request.nodeApi({
                url: `/usuarios`,
                method: 'GET',
                query: {
                    conteudo: '',
                    ordem: 0,
                    status: 0,
                    start: 0,
                    limit: 1,
                }
            });

            if((queryUsuariosCadastrados.total || 0) - 1 >= configs.getUsuarios().maxUsuariosCadastrados) {
                SamosUtils.Msg.alert('Atenção', `Limite de ${configs.getUsuarios().maxUsuariosCadastrados} usuários atingido.`);
            } else {
                return this.callParent(arguments);
            }
        } else {
            return this.callParent(arguments);
        }
    },

    verificarLoginDisponivel: async function (txt, event) {
        if (!SamosUtils.Events.isTab(event) && !SamosUtils.Events.isEnter(event)) {
            return;
        }

        const view = this.getView();

        try {
            const model = this.getRecord();
            const proximoFoco = this.lookup(txt.proximoFoco);

            if (!model.phantom) {
                return
            }
            
            view.initGauge('Verificando disponibilidade de login...');

            const queryLogin = await SamosUtils.Request.nodeApi({
                url: `/consultas/existe`,
                method: 'GET',
                query: {
                    tabela: 'USUARIOS',
                    campo: 'USUARIOS_LOGIN',
                    conteudo: txt.getValue()
                }
            });

            if(queryLogin.results && queryLogin.results.length > 0) {
                const responseName = queryLogin.results[0]['USUARIOS_LOGIN'];
                const responseId   = queryLogin.results[0]['USUARIOS_ID'];
                    
                txt.setValue('');
                Ext.defer(txt.focus, 800, txt, [true]);
                throw 'Já cadastrado!<br><br>Código: ' + responseId + '<br><br>Login: ' + responseName;
            }

            Ext.defer(proximoFoco.focus, 800, proximoFoco, [true]);

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao checar login');
        }

        view.stopGauge(true);
    },

    onGravacaoSucesso: async function (record) { 
        this.callParent(arguments);

        await SamosUtils.Utils.sleep(500);

        if(record.get('USUARIOS_ID') == configs.getUsuario().id) {
            if(await SamosUtils.Msg.confirm('O usuário logado sofreu alterações. Recarregar o sistema?')) {
                window.location.reload();
            }
        }
    },

    onPermissoesClick: function (btn, e) {
        const permissoes = Ext.create({
            xtype: 'permissoes',
            permissoes: this.getView().getPermissoes()
        });

        permissoes.getViewModel().set({
            usuario: this.getRecord().get('USUARIOS_ID'),
            logon  : this.getRecord().get('USUARIOS_LOGIN'),
            perfil : 0
        });
    },

    listenClickImg: function (img) {
        img.el.dom.onclick = event => {
            if(this.getViewModel().get('updating')) {
                const photoView = Ext.create({
                    xtype: 'samoswidgets-photo',
                    field: 'FOTO',
                    model: this.getRecord()
                });

                this.getView().add(photoView);
            }
        };
    },

    onOpcoesClick: Ext.emptyFn,

    onEnviarsenhaporemailClick: async function() {
        const view = this.getView();

        try {
            const usuario = this.getRecord();
            const titulo  = document.getElementsByTagName('title')[0].innerHTML;
            const link    = location.origin + location.pathname;
            const email   = usuario.get('USUARIOS_EMAIL');
    
            if(!SamosUtils.String.isEmail(email)) {
                throw 'O email cadastrado está inválido';
            }
            
            if(await SamosUtils.Msg.confirm('Deseja realmente enviar?')) {
                view.initGauge();
    
                const queryNovaSenha = await SamosUtils.Request.nodeApi({
                    url: `/processos/usuarios/atribuirsenhaaleatoria/${usuario.get('USUARIOS_ID')}`,
                    method: 'PUT'
                });

                const corpo = `<span align="left">
                    <h4 style="font-weight:normal">
                    Olá ${usuario.get('USUARIOS_NOME').split(' ')[0]}!<p>
    
                    Você pode acessar nosso sistema clicando <a href="${link}" target="_blank">nesse link</a>.<p>
                    
                    Suas credenciais de acesso são:<br>
                    Usuário: ${usuario.get('USUARIOS_LOGIN')}<br>
                    Senha: ${queryNovaSenha.results}<p>
                    
                    <p><p>
                    Atenciosamente,<br>
                    
                    Suporte ${titulo}</h4></span>`;
    
                await SamosUtils.Email.enviar({
                    emails:    email,
                    assunto:   'Sua senha está disponível',
                    template:  'resources/email.html',
                    cabecalho: '<h2>Acesso ao Sistema Samos</h2>',
                    corpo:     corpo
                });

                Ext.Note('success', 'Nova senha enviada com sucesso');
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao enviar nova senha');
        }

        view.stopGauge();
    },

    onAtribuirsenhapadraoClick: async function() {
        const view = this.getView();
        
        try {
            const usuario = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente atribuir a senha padrão?')){
                view.initGauge();
    
                await SamosUtils.Request.nodeApi({
                    url: `/processos/usuarios/atribuirsenhapadrao/${usuario.get('USUARIOS_ID')}`,
                    method: 'PUT'
                });
                
                Ext.Note('success', 'Senha padrão atribuída');
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao atribuir senha padrão');
        }
        
        view.stopGauge();
    }
});
