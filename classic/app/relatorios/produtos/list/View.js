Ext.define('SamosAdmin.relatorios.produtos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosprodutoslist',

    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    requires: [
        'SamosAdmin.relatorios.produtos.list.ViewController',
        'SamosAdmin.relatorios.produtos.list.ViewModel'
    ],

    rightbuttons: [
        'Buscar',
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
                                    fieldLabel: 'Ordem',
                                    reference: 'ordem',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Grupo'],
                                        [1, 'Código'],                        
                                        [2, 'Nome']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: configs.getProdutos().status,
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupoi',
                                    reference: 'grupoi',
                                    proximoFoco: 'grupof',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['GRUPOS_NOME', 'GRUPOS_NOME'],
                                        ['GRUPOS_ID',   'GRUPOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueGrupoi}'
                                    }
                                },
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupoi',
                                    itemId: 'idgrupoi',
                                    bind: {
                                        value: '{valueIdGrupoi}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupof',
                                    reference: 'grupof',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['GRUPOS_NOME', 'GRUPOS_NOME'],
                                        ['GRUPOS_ID',   'GRUPOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueGrupof}'
                                    }
                                },
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupof',
                                    itemId: 'idgrupof',
                                    bind: {
                                        value: '{valueIdGrupof}'
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
