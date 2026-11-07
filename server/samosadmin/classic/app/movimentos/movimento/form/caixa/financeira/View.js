Ext.define('SamosAdmin.movimentos.movimento.form.caixa.financeira.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentoscaixafinanceira',

    requires: [
        'SamosAdmin.movimentos.movimento.form.caixa.financeira.ViewModel',
        'SamosAdmin.movimentos.movimento.form.caixa.financeira.ViewController'
    ],

    title: 'Financeira',
    modelName: 'SamosFinanceiros.titulos.Model',
    hidePaging: true,
    height: 340,
    width:  460,

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Sair'
    ],
    
    constructor: function (config) {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {   
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Financeira',
                                    tabela: 'pessoas',
                                    reference: 'pessoa',
                                    buscarPor: 'Genérica',
                                    valueTipo: configs.getFinanceiros().tipoFinanceira,
                                    associations: [
                                        ['PESSOAS_NOME',           'PESSOAS_NOME'],
                                        ['FINANCEIROS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['PESSOAS_TIPO',           'PESSOAS_TIPO']

                                    ],
                                    bind: {
                                        proximoFoco: '{formaPagamento ? "observacoes" : "parcelas"}',
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.FINANCEIROS_ID_PESSOAS}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PESSOAS_TIPO}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    flex: false,
                                    width: 65,
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    minValue: 1,
                                    fieldLabel: 'Parcelas',
                                    reference: 'parcelas',
                                    proximoFoco: 'vcto',
                                    bind: {
                                        ui: '{formaPagamento ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.FINANCEIROS_PARCELAS}',
                                        readOnly: '{readOnly || formaPagamento}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    minValue: momentServer().format('YYYY-MM-DD'),
                                    flex: false,
                                    width: 130,
                                    fieldLabel: 'Vencimento',
                                    reference: 'vcto',
                                    proximoFoco: 'partida',
                                    bind: {
                                        ui: '{formaPagamento ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{readOnly || formaPagamento}',
                                        value: '{model.FINANCEIROS_VENCIMENTO}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Partida',
                                    reference: 'partida',
                                    proximoFoco: 'confirmar',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        ui: '{formaPagamento ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{readOnly || formaPagamento}',
                                        value: '{model.FINANCEIROS_ORIGINAL}',
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Total',
                                    reference: 'total',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.FINANCEIROS_TOTAL}',
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    height: 100,
                                    xtype: 'textarea',
                                    reference: 'observacoes',
                                    fieldLabel: 'Número do Contrato',
                                    proximoFoco: 'credito',
                                    maxLength: 512,
                                    bind: {
                                        value: '{model.FINANCEIROS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    },
                                    anchor: '100%',
                                    grow  : true,
                                    width : '100%'
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
