Ext.define('SamosAdminModern.pessoas.form.View', {
    extend: 'Ext.Panel',
    xtype: 'pessoasform',

    requires: [
        'SamosAdminModern.pessoas.form.ViewController',
        'SamosAdminModern.pessoas.form.ViewModel'
    ],

    controller: 'pessoasform',
    viewModel: 'pessoasform',
    
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
                html: 'Dados da Pessoa',
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
                                    value: '{model.PESSOAS_ID}'
                                }
                            },
                            {
                                xtype: 'togglefield',
                                label: 'Status',
                                width: 100,
                                boxLabel: 'Ativo',
                                cls: `toggle-${tema}`,
                                bind: {
                                    value: '{model.PESSOAS_STATUS}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Nascimento',
                                bind: {
                                    value: '{model.PESSOAS_NASCIMENTO}',
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
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Cadastro',
                                bind: {
                                    value: '{model.PESSOAS_CADASTRO}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Validade',
                                bind: {
                                    value: '{model.PESSOAS_VALIDADE}',
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
                                    value: '{model.PESSOAS_NOME}',
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
                                    value: '{model.PESSOAS_CPFCNPJ}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Inscrição/RG',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_INSCRICAO}',
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
                                label: 'Email',
                                upperCased: false,
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_EMAIL}',
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
                html: 'Endereço de Entrega',
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
                                    value: '{model.PESSOAS_CEP}',
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
                                    value: '{model.PESSOAS_ENDERECO}',
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
                                    value: '{model.PESSOAS_NUMERO}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Bairro',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_BAIRRO}',
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
                                    value: '{model.PESSOAS_TELEFONE}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Celular',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_CELULAR}',
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
                html: 'Endereço de Cobrança',
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
                                width: 100,
                                label: 'CEP',
                                bind: {
                                    value: '{model.PESSOAS_CEPCOBRANCA}',
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
                                            this.up('main').down('panel').getActiveItem().getController().onCepCobrancaClick();
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
                                    value: '{model.CIDADES_NOMECOBRANCA}/{model.CIDADES_ESTADOCOBRANCA}'
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
                                    value: '{model.PESSOAS_ENDERECOCOBRANCA}',
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
                                    value: '{model.PESSOAS_NUMEROCOBRANCA}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Bairro',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_BAIRROCOBRANCA}',
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
                                label: 'RG',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_TELEFONECOBRANCA}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Celular',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_CELULARCOBRANCA}',
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
                html: 'Informações',
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
                        items: [
                            {
                                xtype: 'textareafield',
                                flex: 1,
                                height: 100,
                                label: 'Observações',
                                bind: {
                                    value: '{model.PESSOAS_OBSERVACOES}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    }
                ]
            },
            {
                xtype: 'container',
                padding: 12,
                layout: {
                    type: 'vbox',
                    align: 'center'
                },
                items: {
                    xtype: 'button',
                    height: 35,
                    text: 'Clique aqui para ver as compras',
                    cls: `back-color-${tema}`,
                    style: {
                        textAlign: 'center',
                        color: 'black',
                        borderRadius: '20px'
                    },
                    handler: 'onComprasClick'
                }
            }
        ])
    
        setTimeout(() => {
            this.el.dom.children[0].children[0].style.backgroundColor='transparent';
            this.el.dom.children[0].children[0].children[0].style.backgroundColor='transparent';
        }, 100);
    }
})