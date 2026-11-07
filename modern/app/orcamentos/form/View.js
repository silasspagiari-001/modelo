Ext.define('SamosAdminModern.orcamentos.form.View', {
    extend: 'Ext.Panel',
    xtype: 'orcamentosform',

    requires: [
        'SamosAdminModern.orcamentos.form.ViewController',
        'SamosAdminModern.orcamentos.form.ViewModel'
    ],

    controller: 'orcamentosform',
    viewModel: 'orcamentosform',
    
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
                                flex: 1,
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
                                            this.up('main').down('panel').getActiveItem().getController().onPessoaClick();
                                        }
                                    }
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
                            },
                            {
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/whatsapp.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                bind: {
                                    hidden: '{!readOnly}'
                                },
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onWhatsappClick();
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
                                    value: '{model.MOVIMENTOS_EMAIL}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'image',
                                reference: 'voltar',
                                src: 'resources/images/buttons/email.png',
                                margin: '8 5 0 0',
                                width: 18,
                                height: 18,
                                bind: {
                                    hidden: '{!readOnly}'
                                },
                                listeners: {
                                    initialize: function() {
                                        this.el.dom.onclick = () => {
                                            this.up('main').down('panel').getActiveItem().getController().onEmailClick();
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
                                label: 'Vendedor',
                                flex: 1,
                                readOnly: true,
                                bind: {
                                    value: '{model.USUARIOS_LOGIN}'
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'container', // Documento
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'selectfield',
                                label: 'Documento',
                                flex: 1,
                                hidden: configs.getClientName() != 'racaforte',
                                bind: {
                                    value: '{model.MOVIMENTOS_ID_DOCUMENTOS}'
                                },
                                options: [
                                    { value: 00000, text: 'Selecione'},
                                    { value: 10001, text: 'Orçamento'}
                                ]        
                            }
                        ]
                    },                    
                    {
                        xtype: 'container', // Prazo (Combo por enquanto, depois será um textsearch)
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'selectfield',
                                label: 'Prazo',
                                flex: 1,
                                hidden: configs.getClientName() != 'racaforte',
                                bind: {
                                    value: '{model.MOVIMENTOS_ID_PRAZOS}'
                                },
                                options: [
                                    { value: 1,   text: 'À Vista'},
                                    { value: 130, text: 'Prazo 30 DDL'},
                                    { value: 201, text: 'Prazo (2x) 30/60 DDL'},
                                    { value: 301, text: 'Prazo (3x) 30/60/90 DDL'},
                                    { value: 318, text: 'Prazo (4x) 30/60/90/120 DDL'},
                                    { value: 311, text: 'Prazo (5x) 30/60/90/120/150 DDL'},
                                    { value: 239, text: 'Prazo (6x) 30/60/90/120/150/180 DDL'}
                                ]        
                            }
                        ]
                    }
/*                  {
                        xtype: 'container', // Tipo - Fixo na raçaforte
                        layout: 'hbox',
                        margin: '0 0 10 0',
                        items: [
                            {
                                xtype: 'selectfield',
                                label: 'Tipo',
                                flex: 1,
                                hidden: configs.getClientName() != 'racaforte',
                                bind: {
                                    value: '{model.MOVIMENTOS_SITUACAO}'
                                },
                                options: [
                                    { value: "A", text: 'Boleto'},
                                    { value: "B", text: 'Dinheiro'},
                                    { value: "C", text: 'Débito Cartão'},
                                    { value: "D", text: 'Crédito Cartão'},
                                    { value: "E", text: 'Pix'},
                                    { value: "F", text: 'Cheque'}, 
                                    { value: "G", text: 'Outro'}
                                ]        
                            }
                        ]
                    }*/
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
                        text: 'Pagamentos',
                        cls: `back-color-${tema}`,
                        style: {
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onPagamentosClick'
                    },
                    {
                        xtype: 'container',
                        flex: 1
                    },
                    {
                        xtype: 'button',
                        height: 35,
                        text: 'Produtos',
                        cls: `back-color-${tema}`,
                        style: {
                            textAlign: 'center',
                            color: 'black',
                            borderRadius: '20px'
                        },
                        handler: 'onProdutosClick'
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