Ext.define('SamosAdmin.relatorios.pessoas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriospessoaslist',

    modelName: 'SamosAdmin.atualizacao.pessoas.Model',

    requires: [
        'SamosAdmin.relatorios.pessoas.list.ViewController',
        'SamosAdmin.relatorios.pessoas.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir',
        'Filtros'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Inicial',
                                    flex: 1,
                                    itemId: 'inicial',
                                    reference: 'inicial',
                                    tabela: 'pessoas',
                                    proximoFoco: 'final',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',   'valueInicio']
                                    ],
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Final',
                                    flex: 1,
                                    itemId: 'final',
                                    reference: 'final',
                                    tabela: 'pessoas',
                                    proximoFoco: 'tipo',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',   'valueFinal']
                                    ],
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
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    reference: 'tipo',
                                    store: configs.getPessoas().tipos.concat([['0', 'Todos']]),
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Ordem',
                                    reference: 'ordem',
                                    flex: 1,
                                    store: [
                                        [0, 'Nome'],
                                        [9, 'Fantasia'],                        
                                        [4, 'CPF/CNPJ'],
                                        [7, 'Cidade'],
                                        [5, 'Código']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
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
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
