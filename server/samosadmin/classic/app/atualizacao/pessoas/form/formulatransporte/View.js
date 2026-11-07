Ext.define('SamosAdmin.atualizacao.pessoas.form.formulatransporte.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formpessoasformulatransporte',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.formulatransporte.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.formulatransporte.ViewController'
    ],

    title: 'Parametros de Transporte',
    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    width: 350,
    height: 285,

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
                                    flex: 1,
                                    xtype: 'combobox',
                                    editable: false,
                                    fieldLabel: 'Tipo Pagamento',
                                    reference: 'tipopagamento',
                                    proximoFoco: 'urbanoa',
                                    displayField: 'field2',
                                    store: [
                                        ['percentual', 'Por Percentual'],
                                        ['valor', 'Por Valor Fixo']
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.FORMULA_TIPO}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    fieldLabel: 'Urbano (< R$ 500)',
                                    reference: 'urbanoa',
                                    proximoFoco: 'urbanob',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_URBANOA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Urbano (> R$ 500)',
                                    reference: 'urbanob',
                                    proximoFoco: 'suburbanoa',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_URBANOB}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    fieldLabel: 'SubUrbano (< R$ 500)',
                                    reference: 'suburbanoa',
                                    proximoFoco: 'suburbanob',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_SUBURBANOA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'SubUrbano (> R$ 500)',
                                    reference: 'suburbanob',
                                    proximoFoco: 'valorurbanoa',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.FORMULA_SUBURBANOB}',
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
