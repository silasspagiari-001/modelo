Ext.define('SamosAdminModern.notaeletronica.form.View', {
    extend: 'Ext.Panel',
    xtype: 'notaeletronicaform',

    requires: [
        'SamosAdminModern.notaeletronica.form.ViewController',
        'SamosAdminModern.notaeletronica.form.ViewModel'
    ],

    controller: 'notaeletronicaform',
    viewModel: 'notaeletronicaform',
    
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
                                width: 70,
                                margin: '0 5 0 0',
                                label: 'Número',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                bind: {
                                    value: '{modelNumero}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Status',
                                readOnly: true,
                                upperCased: false,
                                cls: 'input-color-green',
                                bind: {
                                    value: '{status}'
                                }
                            },
                            {
                                xtype: 'datepickerfield',
                                width: 125,
                                label: 'Emissão',
                                cls: 'input-color-red',
                                readOnly: true,
                                bind: {
                                    value: '{model.MOVIMENTOS_EMISSAO}'
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
                                    value: '{model.MOVIMENTOS_NOME}',
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
                                    value: '{model.MOVIMENTOS_CPFCNPJ}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                label: 'Celular',
                                flex: 1,
                                bind: {
                                    value: '{model.MOVIMENTOS_CELULAR}',
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
                                    value: '{model.MOVIMENTOS_EMAIL}',
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
                                label: 'Vendedor',
                                upperCased: false,
                                flex: 1,
                                bind: {
                                    value: '{model.USUARIOS_LOGIN}',
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
                html: 'Totais',
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
                                flex: 1,
                                label: 'Produtos',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    value: '{valorProdutos}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Partida',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                bind: {
                                    value: '{valorPartida}'
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
                                flex: 1,
                                label: '% Desconto',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                readOnly: true,
                                bind: {
                                    value: '{valorPercentual}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'R$ Desconto',
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{valorDescontos}'
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
                                flex: 1,
                                label: 'Despesas',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    value: '{valorDespesas}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Total',
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{valorTotal}'
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
                html: 'Observações',
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
                                    value: '{model.MOVIMENTOS_OBSERVACOES}',
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
                    type: 'hbox',
                    align: 'center'
                },
                items: [
                   {
                        xtype: 'button',
                        height: 35,
                        flex: 1,
                        text: 'Produtos',
                        cls: `back-color-${tema}`,
                        style: {
                            marginRight: '5px',
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onProdutosClick'
                    },
                    {
                        xtype: 'button',
                        height: 35,
                        text: 'WhatsApp',
                        cls: `back-color-${tema}`,
                        flex: 1,
                        style: {
                            marginRight: '5px',
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onWhatsappClick'
                    },
                    {
                        xtype: 'button',
                        height: 35,
                        text: 'Email',
                        flex: 1,
                        cls: `back-color-${tema}`,
                        style: {
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onEmailClick'
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