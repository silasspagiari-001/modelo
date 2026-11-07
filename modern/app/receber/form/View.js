Ext.define('SamosAdminModern.receber.form.View', {
    extend: 'Ext.Panel',
    xtype: 'receberform',

    requires: [
        'SamosAdminModern.receber.form.ViewController',
        'SamosAdminModern.receber.form.ViewModel'
    ],

    controller: 'receberform',
    viewModel: 'receberform',
    
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
                                margin: '0 5 0 0',
                                label: 'Número',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                bind: {
                                    value: '{model.FINANCEIROS_NUMERO}'
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
                                flex: 1,
                                label: 'Emissão',
                                cls: 'input-color-red',
                                readOnly: true,
                                bind: {
                                    value: '{model.FINANCEIROS_EMISSAO}'
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
                                label: 'Celular',
                                flex: 1,
                                bind: {
                                    value: '{model.PESSOAS_CELULAR}',
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
                                label: 'Descontos',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    value: '{valorDescontos}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Taxas',
                                readOnly: true,
                                cls: 'input-text-align-right',
                                bind: {
                                    value: '{valorTaxas}'
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
                                label: 'Juros',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                readOnly: true,
                                bind: {
                                    value: '{valorJuros}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Aberto',
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{valorAberto}'
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
                                label: 'Original',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    value: '{valorOriginal}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Pago',
                                cls: 'input-text-align-right',
                                readOnly: true,
                                bind: {
                                    value: '{valorPago}'
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
                                    value: '{model.FINANCEIROS_OBSERVACOES}',
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
                            marginRight: '5px',
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onEmailClick'
                    },
                    {
                        xtype: 'button',
                        height: 35,
                        text: 'Linha Digitável',
                        flex: 1.3,
                        cls: `back-color-${tema}`,
                        style: {
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onLinhaDigitavelClick'
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