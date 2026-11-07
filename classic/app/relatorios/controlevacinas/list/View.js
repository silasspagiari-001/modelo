Ext.define('SamosAdmin.relatorios.controlevacinas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscontrolevacinaslist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.controlevacinas.list.ViewController',
        'SamosAdmin.relatorios.controlevacinas.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 90,
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    allowDecimals: true,
                                    fieldLabel: 'NF-e Inicial',
                                    reference: 'nota',
                                    proximoFoco: 'inicio',                                    
                                    bind: {
                                        value: '{valueNota}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Data Inicial',
                                    reference: 'inicio',
                                    proximoFoco: 'final',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Data Final',
                                    reference: 'final',
                                    proximoFoco: 'nfinicial',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
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
