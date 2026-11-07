Ext.define('SamosAdminModern.pedidos.pagamentos.View', {
    extend: 'Ext.Panel',
    xtype: 'pedidospagamentos',

    requires: [
        'SamosAdminModern.pedidos.pagamentos.ViewController',
        'SamosAdminModern.pedidos.pagamentos.ViewModel'
    ],

    controller: 'pedidospagamentos',
    viewModel: 'pedidospagamentos',
    
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
                padding: 5,
                margin: 5,
                style: {
                    border: 'solid 1px',
                    borderRadius: '5px'
                },
                items: [
                    {
                        xtype: 'container',
                        margin: '0 0 10 0',
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Dinheiro',
                                reference: 'dinheiro',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorDinheiro}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Cartão Débito',
                                reference: 'debito',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorDebito}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Cheque',
                                reference: 'cheque',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorCheque}'
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
                                flex: 1,
                                label: 'Cartão Crédito',
                                reference: 'credito',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorCredito}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Vencto 1º',
                                readOnly: true
                            },
                            {
                                xtype: 'selectfield',
                                reference: 'parcelascredito',
                                label: 'Parcelas',
                                flex: 1,
                                bind: {
                                    value: '{pagamento.MOVIMENTOSFORMAS_PRCCREDITO}'
                                },
                                options: new Array(12).fill(0).map((parcela, index) => {
                                    return { value: index + 1, text: index + 1 }
                                })
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                reference: 'valorparcelacredito',
                                label: 'R$ Parcela',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaCredito}'
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
                                flex: 1,
                                label: 'Financeira',
                                reference: 'financeira',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorFinanceira}'
                                }
                            },
                            {
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Vencto 1º',
                                reference: 'vencimentofinanceira',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{pagamento.MOVIMENTOSFORMAS_VCTFINANCEIRA}'
                                }
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Parcelas',
                                reference: 'parcelasfinanceira',
                                flex: 1,
                                bind: {
                                    value: '{pagamento.MOVIMENTOSFORMAS_PRCFINANCEIRA}'
                                },
                                options: new Array(12).fill(0).map((parcela, index) => {
                                    return { value: index + 1, text: index + 1 }
                                })
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'R$ Parcela',
                                reference: 'valorparcelafinanceira',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaFinanceira}'
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
                                flex: 1,
                                label: 'Cheque-Pré',
                                reference: 'chequepre',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorChequePre}'
                                }
                            },
                            {
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Vencto 1º',
                                reference: 'vencimentochequepre',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{pagamento.MOVIMENTOSFORMAS_VCTCHEQUEPRE}'
                                }
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Parcelas',
                                reference: 'parcelaschequepre',
                                flex: 1,
                                bind: {
                                    value: '{pagamento.MOVIMENTOSFORMAS_PRCCHEQUEPRE}'
                                },
                                options: new Array(12).fill(0).map((parcela, index) => {
                                    return { value: index + 1, text: index + 1 }
                                })
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'R$ Parcela',
                                reference: 'valorparcelachequepre',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaChequePre}'
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
                                flex: 1,
                                label: 'Duplicata',
                                cls: 'input-text-align-right',
                                reference: 'duplicata',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorDuplicata}'
                                }
                            },
                            {
                                xtype: 'datepickerfield',
                                flex: 1,
                                label: 'Vencto 1º',
                                reference: 'vencimentoduplicata',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{pagamento.MOVIMENTOSFORMAS_VCTDUPLICATA}'
                                }
                            },
                            {
                                xtype: 'selectfield',
                                label: 'Parcelas',
                                reference: 'parcelasduplicata',
                                flex: 1,
                                bind: {
                                    value: '{pagamento.MOVIMENTOSFORMAS_PRCDUPLICATA}'
                                },
                                options: new Array(12).fill(0).map((parcela, index) => {
                                    return { value: index + 1, text: index + 1 }
                                })
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'R$ Parcela',
                                reference: 'valorparceladuplicata',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaDuplicata}'
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
                                flex: 1,
                                label: 'Transferência/Pix',
                                reference: 'transferencias',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorTransferencias}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Partida Financeira',
                                reference: 'partida',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorPartida}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                label: 'Valor Restante',
                                reference: 'restante',
                                cls: 'input-text-align-right input-color-red',
                                margin: '0 5 0 0',
                                style: {
                                    color: 'red'
                                },
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorRestante}'
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