Ext.define('SamosAdmin.relatorios.livrocontrolado.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioslivrocontroladolist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.livrocontrolado.list.ViewController',
        'SamosAdmin.relatorios.livrocontrolado.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {

            formgroups: [
                {
                    xtype: 'container',
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
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
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['TD', 'Todos'],
                                        ['A1', '(A1)'],
                                        ['A2', '(A2)'],
                                        ['A3', '(A3)'],
                                        ['A4', '(A4)'],                        
                                        ['A5', '(A5)'],
                                        ['B1', '(B1)'],
                                        ['B2', '(B2)'],
                                        ['B3', '(B3)'],
                                        ['B4', '(B4)'],                        
                                        ['B5', '(B5)'],
                                        ['C1', '(C1)'],
                                        ['C2', '(C2)'],
                                        ['C3', '(C3)'],
                                        ['C4', '(C4)'],                        
                                        ['C5', '(C5)']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    width: 20
                                },
                                {
                                    width: 150,
                                    fieldLabel: 'Termo Abertura',
                                    reference: 'abertura',
                                    bind: {
                                        value: '{valueAbertura}',
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Imprimir',
                                    checked: true
                                },
                                {
                                    width: 150,
                                    fieldLabel: 'Termo Encerramento',
                                    reference: 'encerramento',
                                    bind: {
                                        value: '{valueEncerramento}',
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Imprimir',
                                    checked: true
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
