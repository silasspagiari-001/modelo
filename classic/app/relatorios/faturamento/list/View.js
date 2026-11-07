Ext.define('SamosAdmin.relatorios.faturamento.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosfaturamentolist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model', // manter o model de empresas por enquanto.

    requires: [
        'SamosAdmin.relatorios.faturamento.list.ViewController',
        'SamosAdmin.relatorios.faturamento.list.ViewModel'
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
                                    fieldLabel: 'Faturamento',
                                    flex: 1,
                                    store: [
                                        [0, 'Faturamento Período'],  // Sintético e Analítico                
                                        [1, 'Vendas por Produto'],   // Sintético e Analítico
                                        [2, 'Vendas por Cliente'],
                                        [3, 'Vendas por Vendedor'],
                                        [4, 'Lista de Preços'],
                                        [5, 'Comissões'],
                                        [6, 'Romaneios']
                                    ],
                                    bind: {
                                        value: '{valueFaturamento}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    store: [
                                        [0, 'Sintético'],
                                        [1, 'Analítico']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
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
