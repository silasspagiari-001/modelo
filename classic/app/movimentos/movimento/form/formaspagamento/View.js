Ext.define('SamosAdmin.movimentos.movimento.form.formaspagamento.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosformaspagamento',

    requires: [
        'SamosAdmin.movimentos.movimento.form.formaspagamento.ViewModel',
        'SamosAdmin.movimentos.movimento.form.formaspagamento.ViewController'
    ],

    width: 625,
    height: 480,
    title: 'Forma de Pagamento',

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    defaults: {
                        defaults: {
                            flex: false,
                            width: 110
                        }
                    },
                    items: [
                        {   
                            items: [
                                {
                                    fieldLabel: 'Dinheiro',
                                    reference: 'dinheiro',
                                    proximoFoco: 'credito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_DINHEIRO}',
                                        readOnly: '{readOnly || isFaturado}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cartão Crédito',
                                    reference: 'credito',
                                    proximoFoco: 'parcelascredito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_CREDITO}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}',
                                    },
                                    listeners: {
                                        change: 'calcularParcelasCredito'
                                    }
                                },
                                {
                                    fieldLabel: '1º Vcto',
                                    reference: 'vctocredito',
                                    fieldStyle: 'text-align:center;',
                                    proximoFoco: 'parcelascredito',
                                    flex: 1,
                                    readOnly: true,
                                    ui: 'field-readonly'
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    emptyText: '',
                                    flex: false,
                                    width: 80,
                                    fieldLabel: 'Parcelas',
                                    reference: 'parcelascredito',
                                    fieldStyle: 'text-align:center;',
                                    store: new Array(12).fill(1).map((p,i) => p * i + 1),
                                    proximoFoco: 'debito',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_PRCCREDITO}',                                        
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    },
                                    listeners: {
                                        change: 'calcularParcelasCredito'
                                    }
                                },
                                {
                                    fieldLabel: 'Parc. Crédito',
                                    reference: 'parcelacredito',
                                    proximoFoco: 'debito',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_VLRCREDITO}'
                                    },
                                    listeners: {
                                        blur: 'validarValorCredito'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Cartão Débito',
                                    reference: 'debito',
                                    proximoFoco: 'carne',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_DEBITO}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    }
                                },
                                {
                                    fieldLabel: 'Carnê',
                                    reference: 'carne',
                                    proximoFoco: 'vctocarne',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_DUPLICATA}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'                                        
                                    },
                                    listeners: {
                                        change: 'calcularParcelasCarne'
                                    }
                                },
                                {
                                    fieldLabel: '1º Vcto',
                                    reference: 'vctocarne',
                                    proximoFoco: 'parcelascarne',
                                    fieldStyle: 'text-align:center;',
                                    xtype: 'datefield',
                                    flex: 1,
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_VCTDUPLICATA}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    emptyText: '',
                                    forceSelection: true,
                                    flex: false,
                                    width: 80,
                                    fieldLabel: 'Parcelas',
                                    reference: 'parcelascarne',
                                    fieldStyle: 'text-align:center;',
                                    proximoFoco: 'cheque',
                                    store: new Array(12).fill(1).map((p,i) => p * i + 1),
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_PRCDUPLICATA}',                                        
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    },
                                    listeners: {
                                        change: 'calcularParcelasCarne'
                                    }
                                },
                                {
                                    fieldLabel: 'Parc. Carnê',
                                    reference: 'parcelacarne',
                                    proximoFoco: 'cheque',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_VLRDUPLICATA}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    },
                                    listeners: {
                                        blur: 'validarValorCarne'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Cheque',
                                    reference: 'cheque',
                                    proximoFoco: 'chequepre',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_CHEQUE}',
                                        readOnly: '{readOnly || isFaturado}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cheque Pré',
                                    reference: 'chequepre',
                                    proximoFoco: 'vctochequepre',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_CHEQUEPRE}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'                                        
                                    },
                                    listeners: {
                                        change: 'calcularParcelasChequePre'
                                    }
                                },
                                {
                                    fieldLabel: '1º Vcto',
                                    reference: 'vctochequepre',
                                    proximoFoco: 'parcelaschequepre',
                                    xtype: 'datefield',
                                    fieldStyle: 'text-align:center;',
                                    flex: 1,
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_VCTCHEQUEPRE}',
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    emptyText: '',
                                    fieldLabel: 'Parcelas',
                                    flex: false,
                                    width: 80,
                                    reference: 'parcelaschequepre',
                                    fieldStyle: 'text-align:center;',
                                    proximoFoco: 'partida',
                                    store: new Array(12).fill(1).map((p,i) => p * i + 1),
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_PRCCHEQUEPRE}',                                        
                                        readOnly: '{readOnly || isFaturado || readOnlyCartao}',
                                        ui: '{!readOnlyCartao ? "textbold-' + tema + '" : "field-readonly"}'
                                    },
                                    listeners: {
                                        change: 'calcularParcelasChequePre'
                                    }
                                },
                                {
                                    fieldLabel: 'Parc. Cheque Pré',
                                    reference: 'parcelachequepre',
                                    proximoFoco: 'partida',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_VLRCHEQUEPRE}'
                                    },
                                    listeners: {
                                        blur: 'validarValorChequePre'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Partida Financeira',
                                    reference: 'partida',
                                    proximoFoco: 'financeira',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOS_BASEST}',
                                        readOnly: '{readOnly || isFaturado}'
                                    }
                                },
                                {
                                    fieldLabel: 'Financeira',
                                    reference: 'financeira',
                                    proximoFoco: 'vctofinanceira',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_FINANCEIRA}',
                                        readOnly: '{readOnly || isFaturado}'
                                    },
                                    listeners: {
                                        change: 'validarValorFinanceira'
                                    }
                                },
                                {
                                    fieldLabel: '1º Vcto',
                                    reference: 'vctofinanceira',
                                    proximoFoco: 'parcelasfinanceira',
                                    fieldStyle: 'text-align:center;',
                                    xtype: 'datefield',
                                    flex: 1,
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_VCTFINANCEIRA}',
                                        readOnly: '{readOnly || isFaturado}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    emptyText: '',
                                    fieldLabel: 'Parcelas',
                                    flex: false,
                                    width: 80,
                                    reference: 'parcelasfinanceira',
                                    fieldStyle: 'text-align:center;',
                                    proximoFoco: 'dinheiro',
                                    store: new Array(48).fill(1).map((p,i) => p * i + 1),
                                    bind: {
                                        readOnly: '{readOnly || isFaturado}',
                                        value: '{model.MOVIMENTOSFORMAS_PRCFINANCEIRA}'
                                    },
                                    listeners: {
                                        change: 'validarValorFinanceira'
                                    }
                                },
                                {
                                    fieldLabel: 'Parc. Financeira',
                                    reference: 'parcelafinanceira',
                                    proximoFoco: 'transferencia',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly || isFaturado}',
                                        value: '{model.MOVIMENTOSFORMAS_VLRFINANCEIRA}',
                                    },
                                    listeners: {
                                        change: 'validarValorFinanceira'
                                    }
                                }
                            ]
                        }, 
                        {
                            items: [
                                {
                                    fieldLabel: 'Transf. Banco/Pix',
                                    reference: 'transferencia',
                                    proximoFoco: 'creditopessoa',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSFORMAS_TRANSFERENCIAS}',
                                        readOnly: '{readOnly || isFaturado}'
                                    }
                                },
                                {
                                    fieldLabel: 'Crédito Pessoa',
                                    reference: 'creditopessoa',
                                    proximoFoco: 'dinheiro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOS_VALORIPI}',
                                        readOnly: '{readOnly || isFaturado}'
                                    },
                                    listeners: {
                                        blur: 'validarValorCreditoPessoa'
                                    }
                                },
                                {
                                    fieldLabel: ' ',
                                    flex: 4,
                                    reference: 'livre',
                                    xtype: 'samoswidgets-textupper',
                                    readOnly: true,
                                    ui: 'field-readonly'                                    
                                }
                            ]
                        }
                    ]
                },
                {
                    height: 95,
                    items: [
                        {   
                            defaults: {
                                xtype: 'container',
                                layout: 'hbox'
                            },
                            items: [
                                {
                                    style: {
                                        padding: '0 !important',
                                        margin: '0 5px 2px 0 !important',
                                        border: '1px solid #c5c5c5 !important'
                                    },
                                    items: [
                                        {
                                            xtype: 'displayfield',
                                            reference: 'valorrestante',
                                            width: 275,
                                            height: 65,
                                            readOnly: true,
                                            fieldStyle: {
                                                color: 'red !important',
                                                fontSize: '25px',
                                                fontWeight: 'bold',
                                                textAlign: 'center'
                                            },
                                            style: {
                                                margin: '0 !important',
                                                padding: '0 !important'
                                            },
                                            bind: {
                                                value: '<span style="font-size:11px">Valor restante</span><br>{valorRestanteFormatted}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    style: {
                                        padding: '0 !important',
                                        margin: '0 0 2px 0 !important',
                                        border: '1px solid #c5c5c5 !important'
                                    },
                                    items: [
                                        {
                                            xtype: 'displayfield',
                                            reference: 'novovalor',
                                            width: 275,
                                            height: 65,
                                            readOnly: true,
                                            fieldStyle: {
                                                color: 'green !important',
                                                fontSize: '25px',
                                                fontWeight: 'bold',
                                                textAlign: 'center'
                                            },
                                            style: {
                                                margin: '0 !important',
                                                padding: '0 !important'
                                            },
                                            bind: {
                                                value: '<span style="font-size:11px">Valor com acréscimos</span><br>{novoValorFormatted}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
