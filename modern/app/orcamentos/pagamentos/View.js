Ext.define('SamosAdminModern.orcamentos.pagamentos.View', {
    extend: 'Ext.Panel',
    xtype: 'orcamentospagamentos',

    requires: [
        'SamosAdminModern.orcamentos.pagamentos.ViewController',
        'SamosAdminModern.orcamentos.pagamentos.ViewModel'
    ],

    controller: 'orcamentospagamentos',
    viewModel: 'orcamentospagamentos',
    
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Dinheiro',
                                reference: 'dinheiro',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorDinheiro}'
                                },
                                listeners: {
                                    keyup: 'calcularValorRestante'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Cartão Débito',
                                reference: 'debito',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorDebito}'
                                },
                                listeners: {
                                    keyup: 'calcularValorRestante'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Cheque',
                                reference: 'cheque',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorCheque}'
                                },
                                listeners: {
                                    keyup: 'calcularValorRestante'
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Cartão Crédito',
                                reference: 'credito',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorCredito}'
                                },
                                listeners: {
                                    change: 'calcularParcelasCredito',
                                    keyup: 'calcularValorRestante'
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
                                }),
                                listeners: {
                                    change: 'calcularParcelasCredito'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                reference: 'valorparcelacredito',
                                label: 'R$ Parcela',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaCredito}'
                                },
                                listeners: {
                                    blur: 'validarValorCredito'
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Financeira',
                                reference: 'financeira',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorFinanceira}'
                                },
                                listeners: {
                                    change: 'validarValorFinanceira',
                                    keyup: 'calcularValorRestante'
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
                                }),
                                listeners: {
                                    change: 'validarValorFinanceira'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'R$ Parcela',
                                reference: 'valorparcelafinanceira',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaFinanceira}'
                                },
                                listeners: {
                                    change: 'validarValorFinanceira'
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Cheque-Pré',
                                reference: 'chequepre',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorChequePre}'
                                },
                                listeners: {
                                    change: 'calcularParcelasChequePre',
                                    keyup: 'calcularValorRestante'
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
                                }),
                                listeners: {
                                    change: 'calcularParcelasChequePre'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'R$ Parcela',
                                reference: 'valorparcelachequepre',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaChequePre}'
                                },
                                listeners: {
                                    blur: 'validarValorChequePre'
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Duplicata',
                                cls: 'input-text-align-right',
                                reference: 'duplicata',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorDuplicata}'
                                },
                                listeners: {
                                    change: 'calcularParcelasCarne',
                                    keyup: 'calcularValorRestante'
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
                                }),
                                listeners: {
                                    change: 'calcularParcelasCarne'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'R$ Parcela',
                                reference: 'valorparceladuplicata',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorParcelaDuplicata}'
                                },
                                listeners: {
                                    blur: 'validarValorCarne'
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
                                xtype: 'samoswidgetsmodern-textmoney',
                                flex: 1,
                                label: 'Transferência/Pix',
                                reference: 'transferencias',
                                cls: 'input-text-align-right',
                                margin: '0 5 0 0',
                                bind: {
                                    readOnly: '{readOnly}',
                                    value: '{valorTransferencias}'
                                },
                                listeners: {
                                    keyup: 'calcularValorRestante'
                                }
                            },
                            {
                                xtype: 'samoswidgetsmodern-textmoney',
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
                    },
                    {
                        xtype: 'container',
                        layout: {
                            type: 'hbox',
                            align: 'center'
                        },
                        bind: {
                            hidden: '{readOnly}'
                        },
                        items: [
                            {
                                xtype: 'container',
                                flex: 1
                            },
                            {
                                xtype: 'button',
                                height: 35,
                                text: 'Cancelar',
                                margin: '0 5 0 0',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onCancelarClick'
                            },
                            {
                                xtype: 'button',
                                height: 35,
                                text: 'Confirmar',
                                cls: `back-color-${tema}`,
                                style: {
                                    textAlign: 'center',
                                    color: 'black',
                                    borderRadius: '20px'
                                },
                                handler: 'onConfirmarClick'
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