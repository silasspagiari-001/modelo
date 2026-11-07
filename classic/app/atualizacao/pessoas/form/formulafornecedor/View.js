Ext.define('SamosAdmin.atualizacao.pessoas.form.formulafornecedor.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formpessoasformulafornecedor',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.formulafornecedor.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.formulafornecedor.ViewController'
    ],

    title: 'Parametros de Fornecedor',
    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    width: 350,
    height: 240,//285

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {   
                            items: [
                                {
                                    fieldLabel: '% Desconto',
                                    reference: 'desconto',
                                    proximoFoco: 'ipi',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_DESCONTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: '% IPI',
                                    reference: 'ipi',
                                    proximoFoco: 'seguro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_IPI}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: '% Seguro',
                                    reference: 'seguro',
                                    proximoFoco: 'prazo',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_SEGURO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    fieldLabel: 'Prazo',
                                    reference: 'prazo',
                                    proximoFoco: 'frete',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_PRAZO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: '% Frete',
                                    reference: 'frete',
                                    proximoFoco: 'despesas',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_FRETE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: '% Despesas',
                                    reference: 'despesas',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_DESPESAS}',
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
