Ext.define('SamosAdmin.relatorios.caixasintetico.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscaixasinteticolist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.caixasintetico.list.ViewController',
        'SamosAdmin.relatorios.caixasintetico.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
        Ext.apply(this, {
            toolbar: [
                {
                    xtype: 'datefield',
                    fieldLabel: 'Inicio',
                    reference: 'inicio',
                    flex: 1,
                    bind: {
                        value: '{valueInicio}'
                    }
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Final',
                    reference: 'final',
                    flex: 1,
                    bind: {
                        value: '{valueFinal}'
                    }
                },
                {
                    xtype: 'combobox',
                    fieldLabel: 'Opção',
                    flex: 1,
                    store: [
                        ['1', 'Com Despesas'],
                        ['2', 'Sem Despesas']
                    ],
                    bind: {
                        value: '{valueOpcao}'
                    }
                }
            ]
        });

        this.callParent(arguments);
    }
});
