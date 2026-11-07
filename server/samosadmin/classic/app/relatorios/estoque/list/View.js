Ext.define('SamosAdmin.relatorios.estoque.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosestoquelist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model', // manter o model de empresas por enquanto.

    requires: [
        'SamosAdmin.relatorios.estoque.list.ViewController',
        'SamosAdmin.relatorios.estoque.list.ViewModel'
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
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Estoque',
                                    flex: 1,
                                    store: [
                                        [0, 'Inventário Produtos'],
                                        [1, 'Saldos Estoque'],
                                        [2, 'Movimentados no Período'],
                                        [3, 'Kardex'],
                                        [4, 'Estoque Empresas']
                                    ],
                                    bind: {
                                        value: '{valueEstoque}'
                                    }
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
                                    fieldLabel: 'Ordem',
                                    flex: 1,
                                    store: [
                                        [0, 'Nome'],
                                        [1, 'Código']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Status',
                                    flex: 1,
                                    store: [
                                        [0, 'Ativos'],
                                        [1, 'Inativos'],
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
                                    fieldLabel: 'Início',
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
