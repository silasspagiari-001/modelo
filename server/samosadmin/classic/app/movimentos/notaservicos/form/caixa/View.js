Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formnotaservicoscaixa',

    requires: [
        'SamosAdmin.movimentos.notaservicos.form.caixa.ViewModel',
        'SamosAdmin.movimentos.notaservicos.form.caixa.ViewController'
    ],

    width: 610, 
    height: 425,

    leftbuttons: [
        'Alterar',
        'Financeiro',
        'Cartões',
        'Cheques',
        'Boleto'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {
            title: configs.getEmpresa().regimeCaixa ? 'Caixa' : 'Pagamento',
            formgroups: [
                {
                    defaults: {
                        defaults: {
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
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cheque',
                                    reference: 'cheque',
                                    proximoFoco: 'credito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CHEQUE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cartão Crédito',
                                    reference: 'credito',
                                    proximoFoco: 'debito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cartão Débito',
                                    reference: 'debito',
                                    proximoFoco: 'cartaoloja',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_DEBITO}',
                                        readOnly: '{readOnly}'
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
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITOLOJA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: configs.getFinanceiros().labelAlimentacao,
                                    reference: 'valealimentacao',
                                    proximoFoco: 'valerefeicao',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_ALIMENTACAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Vale Refeição',
                                    reference: 'valerefeicao',
                                    proximoFoco: 'valepresente',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_REFEICAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Vale Presente',
                                    reference: 'valepresente',
                                    proximoFoco: 'valecombustivel',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_PRESENTE}',
                                        readOnly: '{readOnly}'
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
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_COMBUSTIVEL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Duplicata',
                                    reference: 'duplicata',
                                    proximoFoco: 'transferencia',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        fieldStyle:'{isVendaConsumidor ? "color:red;" : "color:black;"}',
                                        value: '{model.MOVIMENTOSCAIXA_DUPLICATA}',
                                        readOnly: '{readOnly || isVendaConsumidor}',
                                        ui: '{isVendaConsumidor ? "field-readonly" : "textbold-' + tema + '"}',
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
                                    proximoFoco: 'outro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_TRANSFERENCIAS}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    fieldLabel: configs.getFinanceiros().labelOutro,
                                    reference: 'outro',
                                    proximoFoco: 'dinheirorecebido',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_OUTRO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    flex: 2,
                                    fieldLabel: 'Conta',
                                    tabela: 'pessoas',
                                    reference: 'contabanco',
                                    buscarPor: 'Contéudo',
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
                                    bind: {
                                        value: '{model.MOVIMENTOSCAIXA_CREDITOPESSOA}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    fieldLabel: 'Troco',
                                    reference: 'troco',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
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
