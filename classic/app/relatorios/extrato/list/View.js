Ext.define('SamosAdmin.relatorios.extrato.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosextratolist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.extrato.list.ViewController',
        'SamosAdmin.relatorios.extrato.list.ViewModel'
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
                    xtype: 'container',
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Conta',
                                    tabela: 'portadores',
                                    complement: 'idportador',
                                    reference: 'portador',
                                    buscarPor: 'Contéudo',
                                    vmAssociations: [
                                        ['PORTADORES_ID',   'valueIdPortador'],
                                    ],
                                    campoModelMostrarAposBuscar: 'PORTADORES_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPortador',
                                    itemId: 'idportador'
                                }
                            ]
                        },
                        {
                           xtype: 'container',
                           layout: 'hbox',
                           items: [
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    store: [
                                        [0, 'Extrato'],
                                        [1, 'Cheques']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Status',
                                    flex: 1,
                                    store: [
                                        [0, 'Conciliados'],
                                        [1, 'Não Conciliados'],
                                        [2, 'Todos']
                                    ],
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                }
                           ]
                        },
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
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});