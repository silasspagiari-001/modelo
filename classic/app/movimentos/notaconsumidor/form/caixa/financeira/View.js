Ext.define('SamosAdmin.movimentos.notaconsumidor.form.caixa.financeira.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formnotaconsumidorcaixafinanceira',

    requires: [
        'SamosAdmin.movimentos.notaconsumidor.form.caixa.financeira.ViewModel',
        'SamosAdmin.movimentos.notaconsumidor.form.caixa.financeira.ViewController'
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
                                    proximoFoco: 'parcelas',
                                    associations: [
                                        ['PESSOAS_NOME',           'PESSOAS_NOME'],
                                        ['FINANCEIROS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['PESSOAS_TIPO',           'PESSOAS_TIPO']

                                    ],
                                    bind: {
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
                                    width: 65,
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    minValue: 1,
                                    fieldLabel: 'Parcelas',
                                    reference: 'parcelas',
                                    proximoFoco: 'vcto',
                                    bind: {
                                        value: '{model.FINANCEIROS_PARCELAS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    minValue: momentServer().format('YYYY-MM-DD'),
                                    width: 130,
                                    fieldLabel: 'Vencimento',
                                    reference: 'vcto',
                                    proximoFoco: 'total',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.FINANCEIROS_VENCIMENTO}'
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
