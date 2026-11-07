Ext.define('SamosAdminModern.login.View', {
    extend: 'Ext.Panel',
    xtype: 'login',

    requires: [
        'SamosAdminModern.login.ViewController',
        'SamosAdminModern.login.ViewModel'
    ],

    controller: 'login',
    viewModel: 'login',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    style: {
        backgroundColor: 'transparent'
    },

    initialize: function() {
        const tema = configs.getTema();

        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                height: 35,
                html: 'Sistema SamosAdmin',
                padding: '12 12 0 12',
                margin: 0,
                style: {
                    textAlign: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }
            },
            {
                xtype: 'container',
                height: 35,
                html: 'Sistema de gestão empresarial na WEB',
                padding: '0 12 0 12',
                margin: 0,
                style: {
                    textAlign: 'center',
                    fontSize: '14px'
                }
            },
            {
                xtype: 'container',
                padding: 0,
                margin: 0,
                layout: {
                    type: 'vbox',
                    align: 'center'
                },
                items: [
                    {
                        xtype: 'textfield',
                        reference: 'txtlogin',
                        margin: '3 0 0 0',
                        padding: '8 3',
                        width: 250,
                        style: {
                            backgroundColor: 'white',
                            border: 'solid 1px',
                            borderRadius: '6px',
                            paddingBottom: '0px'
                        }
                    },
                    {
                        xtype: 'passwordfield',
                        reference: 'txtsenha',
                        margin: '7 0 0 0',
                        padding: '8 3',
                        width: 250,
                        style: {
                            backgroundColor: 'white',
                            border: 'solid 1px',
                            borderRadius: '6px',
                            paddingBottom: '0px'
                        }
                    },
                    {
                        xtype: 'container',
                        width: 250,
                        height: 155,
                        margin: '7 0',
                        padding: '0',
                        layout: 'fit',
                        style: {
                            border: 'solid 1px',
                            borderRadius: '6px',
                            paddingBottom: '0px'
                        },
                        items: [
                            {
                                xtype: 'list',
                                height: 155,
                                margin: '0',
                                padding: '0',
                                reference: 'empresas',
                                itemTpl: '{EMPRESAS_FANTASIA}',
                                deselectable: false,
                                clicarNoProximoFoco: true,
                                cls: `list-${tema}`,
                                style: {
                                    backgroundColor: 'transparent'
                                },
                                bind: {
                                    store: '{permissoes}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        width: 250,
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'button',
                                width: 100,
                                height: 25,
                                text: 'Sair',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    lineHeight: '15px',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: function() {
                                    window.location.reload();
                                }
                            },
                            {
                                xtype: 'container',
                                flex: 1
                            },
                            {
                                xtype: 'button',
                                width: 100,
                                height: 25,
                                text: 'Logar',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    lineHeight: '15px',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onLoginClick',
                                bind: {
                                    hidden: '{logged}'
                                }
                            },
                            {
                                xtype: 'button',
                                width: 100,
                                height: 25,
                                text: 'Entrar',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    lineHeight: '15px',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onEntrarClick',
                                bind: {
                                    hidden: '{unlogged}'
                                }
                            }
                        ]
                    }
                ]
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})