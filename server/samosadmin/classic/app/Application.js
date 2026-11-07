Ext.define('SamosAdmin.Application', {
    extend: 'Ext.app.Application',
    name: 'SamosAdmin',

    requires: [
        'Ext.ux.*',
        'SamosUtils.*',
        'SamosWidgets.*',
        'SamosAdmin.*',
        'SamosLogin.*',
        'SamosViewport.*',
        'SamosFinanceiros.*'
    ],
    
    launch: function () {

//     SamosWidgets.ChatSocket.connect(); // conectando ao servidor de chat

        if (!!Ext.ClientConfig) {
            const faviconLink = document.querySelector("link[rel*='icon']") || document.createElement('link');
            
            sessionStorage.setItem(Object.keys(Ext.app.namespaces)[1] + 'SessionID', SamosUtils.String.gerarGuid().slice(0, 8));

            this.ping(0)
                .then(async configIndex => {
                    if(configIndex === false) {
                        Ext.Note('error', 'Servidores offline', 9999999);
                    } else {
                        configs.set(Ext.ClientConfig);
                        configs.setApiNode(Ext.ClientConfig.apiNode[configIndex]);
//                      configs.setApiDelphi(Ext.ClientConfig.apiDelphi[configIndex]);
                        
                        //momentTz: instancia do moment.tz com o timezone do config
                        //momentServer: data/hora servidor (sempre atualizada)
                        moment.locale('pt-br');
                        
                        window.momentTz = function() {
                            const args = Array.from(arguments);
                            args.push(configs.getTimezone());
                            return moment.tz.apply(this, args);
                        };

                        this.iniciarAtalhosGlobais();

                        window.momentServer = momentTz.bind(window, momentTz().utc().format());
    
                        localStorage.setItem('tema', configs.getTema());
    
                        faviconLink.type = 'image/x-icon';
                        faviconLink.rel = 'shortcut icon';
                        faviconLink.href = `favicon.ico`;
                        document.getElementsByTagName('head')[0].appendChild(faviconLink); 
    
                        localStorage.setItem('ultimoNumeroNFE', '');
                        localStorage.setItem('ultimaSerieNFE',  '');
                        localStorage.setItem('ultimoNumeroCFE', '');
                        localStorage.setItem('ultimaSerieCFE',  '');
                        localStorage.setItem('ultimoNumeroNFC', '');
                        localStorage.setItem('ultimaSerieNFC',  '');

                        this.removerLoad();

                        if(configs.getLogin().aparelhosPermitidos) {
                            if (screen.width < 640 || screen.height < 480) {
                                if(!configs.getLogin().aparelhosPermitidos.phone) {
                                    Ext.Msg.alert('Acesso', 'Usuário sem permissão para acesso via celular');
                                    return;
                                }
                            } else if (screen.width < 1024 || screen.height < 768) {
                                if(!configs.getLogin().aparelhosPermitidos.tablet) {
                                    Ext.Msg.alert('Acesso', 'Usuário sem permissão para acesso via tablet');
                                    return;
                                }
                            } else if(!configs.getLogin().aparelhosPermitidos.desktop) {
                                Ext.Msg.alert('Acesso', 'Usuário sem permissão para acesso via desktop');
                                return;
                            }
                        }
                        
                        Ext.create({ 
                            xtype: 'samoslogin',
                            namespace: 'SamosAdmin',
                            faleConosco: true
                        });
                    }
                })
                .catch(err => console.error(err));

        } else {
            setTimeout(() => this.launch(), 500);
        }

        Ext.getBody().dom.oncontextmenu = () => false;
        
        Ext.NAVEGADOR_TAB_ID = new Date().getTime();
    },

    ping: function(index) {
        const host = Ext.ClientConfig.apiNode[index];

        return SamosUtils.Request.ping(host)
            .then(() => index)
            .catch(() => {
                if(!host) {
                    return false;
                } else {
                    return this.ping(++index);
                }
            });
    },

    onAppUpdate: function () {
        window.location.reload();
    },

    removerLoad: function() {
        try{
            Ext.get('loading').remove();
            Ext.get('loading-mask').remove();
        } catch(e) {}
    },

    iniciarAtalhosGlobais: function() {
        window.onkeydown = event => {
            try {
                if (SamosUtils.Events.isF7(event) && configs.getUsuario().privilegiado) {
                    try {
                        const form = Ext.$('formmovimentos')[0];
                        Movimento.services.Model.mostrarPrecoMinimo(form);
                    } catch(error) {
                        throw `Nenhum movimento aberto: F7 exibe o preco minimo do produto selecinado na grid de movimentos`;
                    }
    
                } else if (SamosUtils.Events.isF8(event) && configs.getUsuario().privilegiado) {
                    try {
                        const form = Ext.$('formmovimentos')[0];
                        Movimento.services.Model.mostrarCusto(form);
                    } catch(error) {
                        throw `Nenhum movimento aberto: F8 exibe o custo do movimento`;
                    }
    
                } else if (SamosUtils.Events.isF9(event)) {
                    try {
                        const form = Ext.$('formmovimentos')[0];
                        Movimento.services.Recuperacao.checar(form);
                    } catch(error) {
                        throw `Nenhum movimento aberto: F9 recupera movimentos abandonados`;
                    }
                } else if (SamosUtils.Events.isF10(event)) {
                    try { // Testar bem antes de subir
                        const form = Ext.$('formmovimentos')[0];
                        Movimento.services.Model.mostrarComprasPessoa(form);
                    } catch(error) {
                        throw `Nenhum movimento aberto: F10 exibe o preco das últimas vendas na grid de movimentos`;
                    }
                } else if (Ext.$('formmovimentos').length > 0 && event.altKey && event.ctrlKey && event.code == 'KeyI') {
                    try {
                        const form = Ext.$('formmovimentos')[0];
                        Ext.Note('success', `ID: ${form.model.get('MOVIMENTOS_ID')}`, 5000)
                    } catch(error) {
                        throw `Nenhum movimento aberto: Ctrl + Alt + I exibe o MOVIMENTOS_ID`;
                    }
                    
                //Exibe o ID tambem no cupom eletronico
                } else if (Ext.$('formcupomeletronico').length > 0 && event.altKey && event.ctrlKey && event.code == 'KeyI') {
                    try {
                        const form = Ext.$('formcupomeletronico')[0];
                        Ext.Note('success', `ID: ${form.model.get('MOVIMENTOS_ID')}`, 5000)
                    } catch(error) {
                        throw `Nenhum cupom aberto: Ctrl + Alt + I exibe o MOVIMENTOS_ID`;
                    }
                    
                //Exibe o ID tambem na nota consumidor
                } else if (Ext.$('formnotaconsumidor').length > 0 && event.altKey && event.ctrlKey && event.code == 'KeyI') {
                    try {
                        const form = Ext.$('formnotaconsumidor')[0];
                        Ext.Note('success', `ID: ${form.model.get('MOVIMENTOS_ID')}`, 5000)
                    } catch(error) {
                        throw `Nenhuma nota consumidor aberta: Ctrl + Alt + I exibe o MOVIMENTOS_ID`;
                    }
                    
                } else if (event.altKey && event.code == 'KeyM') {
                    try {
                        const form = Ext.$('formmovimentos')[0];
                        form.getViewModel().set('markupAtivo', !form.getViewModel().get('markupAtivo'));
                    } catch(error) {}
                } else if (event.altKey && event.code == 'KeyC') {
                    try {
                        const form = Ext.$('formmovimentos')[0];
                        form.getViewModel().set('custoAtivo', !form.getViewModel().get('custoAtivo'));
                    } catch(error) {}
                }

            } catch(error) {
                console.warn(error);
            }
        }
    }
});

//WAI-ARIA compatibility warnings can be suppressed by adding the following to application startup code
Ext.ariaWarn = Ext.emptyFn;
