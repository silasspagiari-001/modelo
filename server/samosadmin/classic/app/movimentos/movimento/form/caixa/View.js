Ext.define('SamosAdmin.movimentos.movimento.form.caixa.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentoscaixa',

    requires: [
        'SamosAdmin.movimentos.movimento.form.caixa.ViewModel',
        'SamosAdmin.movimentos.movimento.form.caixa.ViewController'
    ],

    leftbuttons: [
        'Alterar',
        'Financeiro',
        'Financeira',
        'Cartões',
        'Cheques',
        'Boleto',
        'Duplicata',
        'E-mail'
    ],

    rightbuttons: [
        'Gravar',
        'Gravar Conta',
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {
            width: (configs.getClientName() == 'pinguim' ? 616 : 610),
            height: (configs.getClientName() == 'pinguim' ? 350 : 425),
            title: configs.getEmpresa().regimeCaixa ? 'Caixa' : 'Pagamento',
            formgroups: [
                {
                    defaults: {
                        defaults: {
                            flex: false,
                            width: 133
                        }
                    },
                    items: [
                        {   
                            items: [
                                {
                                    fieldLabel: 'Dinheiro',
                                    reference: 'dinheiro',
                                    proximoFoco: 'cheque',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_DINHEIRO}',
                                        readOnly: '{readOnly || readOnlyDinheiro}',
                                        ui: '{readOnlyDinheiro ? "field-readonly" : "textbold-' + tema + '"}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cheque',
                                    reference: 'cheque',
                                    proximoFoco: 'credito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CHEQUE}',
                                        readOnly: '{readOnly || readOnlyCheque}',
                                        ui: '{readOnlyCheque ? "field-readonly" : "textbold-' + tema + '"}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cartão Crédito',
                                    reference: 'credito',
                                    proximoFoco: 'debito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITO}',
                                        readOnly: '{readOnly || readOnlyCredito || readOnlyCartao}',
                                        ui: '{readOnlyCredito ? "field-readonly" : "textbold-' + tema + '"}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cartão Débito',
                                    reference: 'debito',
                                    proximoFoco: 'cartaoloja',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_DEBITO}',
                                        readOnly: '{readOnly || readOnlyDebito || readOnlyCartao}',
                                        ui: '{readOnlyDebito ? "field-readonly" : "textbold-' + tema + '"}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Cartão Loja',
                                    reference: 'cartaoloja',
                                    proximoFoco: 'valealimentacao',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    hidden: configs.getClientName() == 'pinguim',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITOLOJA}'                                        
                                    }
                                },
                                {
                                    fieldLabel: configs.getFinanceiros().labelAlimentacao,
                                    reference: 'valealimentacao',
                                    proximoFoco: 'valerefeicao',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    hidden: configs.getClientName() == 'pinguim',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_ALIMENTACAO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Vale Refeição',
                                    reference: 'valerefeicao',
                                    proximoFoco: 'valepresente',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',                         
                                    readOnly: true,   
                                    hidden: configs.getClientName() == 'pinguim',        
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_REFEICAO}',
                                    }
                                },
                                {
                                    fieldLabel: 'Vale Presente',
                                    reference: 'valepresente',
                                    proximoFoco: 'valecombustivel',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    hidden: configs.getClientName() == 'pinguim',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_PRESENTE}',
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Vale Combustível',
                                    reference: 'valecombustivel',
                                    proximoFoco: 'duplicata',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_COMBUSTIVEL}'
                                    }
                                },
                                {
                                    fieldLabel: 'Duplicata',
                                    reference: 'duplicata',
                                    proximoFoco: 'transferencia',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        fieldStyle:'{isVendaConsumidor || readOnlyDuplicata ? "color:red;" : "color:black;"}',
                                        value: '{model.MOVIMENTOSCAIXA_DUPLICATA}',
                                        readOnly: '{readOnly || isVendaConsumidor || readOnlyDuplicata || readOnlyCartao}',
                                        ui: '{isVendaConsumidor || readOnlyDuplicata ? "field-readonly" : "textbold-' + tema + '"}',
                                    }
                                },
                                {
                                    fieldLabel: 'Pgto Eletrônico',
                                    reference: 'boleto',
                                    proximoFoco: 'outro',
                                    xtype: 'samoswidgets-textmoney',
                                    hidden: true,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_BOLETO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Transf. Banco/Pix',
                                    reference: 'transferencia',
                                    proximoFoco: 'financeira',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_TRANSFERENCIAS}',
                                        readOnly: '{readOnly || readOnlyPix}',
                                        ui: '{readOnlyPix ? "field-readonly" : "textbold-' + tema + '"}'
                                    }
                                },                                
                                {
                                    fieldLabel: configs.getFinanceiros().labelOutro,
                                    reference: 'outro',
                                    proximoFoco: 'dinheirorecebido',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_OUTRO}',
                                        readOnly: '{readOnly || readOnlyOutro}',
                                        ui: '{readOnlyOutro ? "field-readonly" : "textbold-' + tema + '"}',
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'displayfield',
                                    reference: 'mensagemboleto',
                                    width: 400, // 270
                                    readOnly: true,
                                    fieldStyle: {
                                        color: 'red !important',
                                        fontSize: '25px',
                                        fontWeight: 'bold',
                                        backgroundColor: '#f5f5f5',
                                        borerColor: '#f5f5f5',
                                        textAlign: 'center'
                                    },
                                    style: {
                                        margin: '0 !important',
                                        padding: '0.8em 0 0 0 !important'
                                    },
                                    bind: {
                                        hidden: '{!limiteBoletoExcedido}',                                        
                                        value: 'Limite Boleto Excedido'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    flex: 2,
                                    fieldLabel: 'Conta',
                                    tabela: 'pessoas',
                                    reference: 'contabanco',
                                    buscarPor: 'Contéudo',
                                    proximoFoco: 'documento',
                                    valueTipo: (configs.getPessoas().tipos.find(tipo => tipo[1] == 'Contas') || [])[0] || '',                                    
                                    associations: [
                                        ['CONTAS_NOME',               'PESSOAS_NOME'],
                                        ['CONTAS_TIPO',               'PESSOAS_TIPO'],
                                        ['MOVIMENTOSCAIXA_ID_PESSOAS', 'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{model.CONTAS_NOME}',
                                        hidden: '{!isTransferenciaBancaria}',
                                        readOnly: '{!isTransferenciaBancaria}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_ID_PESSOAS}'
                                    }
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
                                            width: 270,
                                            readOnly: true,
                                            fieldStyle: {
                                                color: 'red !important',
                                                fontSize: '25px',
                                                fontWeight: 'bold',
                                                backgroundColor: '#f5f5f5',
                                                borerColor: '#f5f5f5',
                                                textAlign: 'center'
                                            },
                                            style: {
                                                margin: '0 !important',
                                                padding: '0.8em 0 0 0 !important'
                                            },
                                            bind: {
                                                value: '{valorRestanteFormatted}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    fieldLabel: 'Crédito Pessoa',
                                    reference: 'creditopessoa',
                                    proximoFoco: 'troco',
                                    xtype: 'samoswidgets-textmoney',
                                    hidden: configs.getFinanceiros().hideCreditoPessoa,
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITOPESSOA}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    fieldLabel: 'Ø',
                                    xtype: 'textfield',
                                    readOnly: true,
                                    reference: 'camponulo',
                                    ui: 'field-readonly',
                                    hidden: !configs.getFinanceiros().hideCreditoPessoa
                                },
                                {
                                    fieldLabel: 'Troco',
                                    reference: 'troco',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        hidden: '{isCaixaHosp || isCaixaFC}',                                        
                                        value: '{model.MOVIMENTOSCAIXA_TROCO}',
                                        readOnly: '{readOnly}'
                                    }    
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
