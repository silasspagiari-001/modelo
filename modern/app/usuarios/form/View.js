Ext.define('SamosAdminModern.usuarios.form.View', {
    extend: 'Ext.Panel',
    xtype: 'usuariosform',

    requires: [
        'SamosAdminModern.usuarios.form.ViewController',
        'SamosAdminModern.usuarios.form.ViewModel'
    ],

    controller: 'usuariosform',
    viewModel: 'usuariosform',
    
    layout: {
        type: 'vbox',
        align: 'stretch'
    },

    listeners: {
        show: 'showButtons'
    },

    scrollable: true,

    style: {
        backgroundColor: 'transparent'
    },

    cls: 'formcls',

    initialize: function() {
        const tema = configs.getTema();
        
        this.callParent(arguments);

        this.setItems([
            {
                xtype: 'container',
                height: 20,
                padding: 1,
                margin: 5,
                html: 'Dados do Usuário',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px',
                    textAlign: 'center',
                    fontSize: '16px',
                    lineHeight: '18px'
                }
            },
            {
                xtype: 'container',
                padding: 1,
                margin: 5,
                items: [
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                width: 100,
                                label: 'Código',
                                readOnly: true,
                                bind: {
                                    value: '{model.USUARIOS_ID}'
                                }
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Status',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_STATUS}',
                                    readOnly: '{readOnly}'
                                },
                                options: [
                                    {
                                        value: 'I',
                                        text : 'Interno'
                                    },
                                    {
                                        value: 'E',
                                        text : 'Externo'
                                    },
                                    {
                                        value: 'T',
                                        text : 'Interno/Externo'
                                    },
                                    {
                                        value: 'F',
                                        text : 'Inativo'
                                    },
                                    {
                                        value: 'P',
                                        text : 'Pendente'
                                    }
                                ]
                            },
                            {
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Nascimento',
                                bind: {
                                    value: '{model.USUARIOS_NASCIMENTO}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Nome',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_NOME}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'CPF/CNPJ',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_CPFCNPJ}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Tipo',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_TIPO}',
                                    readOnly: '{readOnly}'
                                },
                                options: configs.getUsuarios().tipos.map(tipo => {
                                    return {
                                        value: tipo[0],
                                        text : tipo[1]
                                    }
                                })
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Login',
                                flex: 1,
                                readOnly: true,
                                bind: {
                                    value: '{model.USUARIOS_LOGIN}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Senha',
                                flex: 1,
                                bind: {
                                    hidden: '{hideSenha}',
                                    value: '{model.USUARIOS_SENHA}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/whatsapp.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onEnviarSenhaWhatsAppClick();
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Email',
                                upperCased: false,
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_EMAIL}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'container',
                height: 20,
                padding: 1,
                margin: 5,
                html: 'Endereço Residencial',
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px',
                    textAlign: 'center',
                    fontSize: '16px',
                    lineHeight: '18px'
                }
            },
            {
                xtype: 'container',
                padding: 1,
                margin: 5,
                items: [
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'textfield',
                                width: 80,
                                label: 'CEP',
                                bind: {
                                    value: '{model.USUARIOS_CEP}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/pesquisar.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                bind: {
                                    hidden: '{readOnly}'
                                },
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onCepClick();
                                        }
                                    }
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Cidade/ESTADO',
                                readOnly: true,
                                bind: {
                                    value: '{model.CIDADES_NOME}/{model.CIDADES_ESTADO}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Endereço',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_ENDERECO}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Número',
                                width: 100,
                                bind: {
                                    value: '{model.USUARIOS_NUMERO}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Bairro',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_BAIRRO}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'textfield',
                                label: 'Telefone',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_TELEFONE}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Celular',
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_CELULAR}',
                                    readOnly: '{readOnly}'
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