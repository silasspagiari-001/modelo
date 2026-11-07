Ext.define('SamosAdmin.relatorios.fiscais.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosfiscaislist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.fiscais.list.ViewController',
        'SamosAdmin.relatorios.fiscais.list.ViewModel'
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
                                    fieldLabel: 'Fiscais',
                                    flex: 1,
                                    store: [
                                        [0, 'Resumo de ICMS'],
                                        [1, 'Livro ICMS'],
                                        [2, 'Livro PIS/Cofins'],
                                        [3, 'Apuração de ICMS']
                                    ],
                                    bind: {
                                        value: '{valueFiscais}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    store: [
                                        [0, 'Entrada'],
                                        [1, 'Saida']
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
                                    xtype: 'datefield',
                                    fieldLabel: 'Período',
                                    reference: 'inicio',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Até',
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
