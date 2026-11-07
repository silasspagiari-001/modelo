Ext.define('SamosAdmin.relatorios.inventario.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosinventariolist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.inventario.list.ViewController',
        'SamosAdmin.relatorios.inventario.list.ViewModel'
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
                                    xtype: 'datefield',
                                    fieldLabel: 'Data Base',
                                    reference: 'database',
                                    proximoFoco: 'tiposaldo',
                                    flex: 1,
                                    bind: {
                                        value: '{valueDataBase}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo Saldo',
                                    reference: 'tiposaldo',
                                    proximoFoco: 'preco',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: configs.getClientName() == 'biomart' ?
                                    [
                                        ['0', 'Matéria Prima'],
                                        ['1', 'Embalagens'],
                                        ['2', 'Produtos Acabados'],
                                        ['3', 'Todos']
                                    ] : [
                                        ['0', 'Com Saldo Positivo'],
                                        ['1', 'Com Saldo Negativo'],
                                        ['2', 'Com Saldo Zerado'],
                                        ['3', 'Todos os Produtos'],
                                        ['4', 'Saldo Real']
                                    ],
                                    bind: {
                                        value: '{valueTiposaldo}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Preço',
                                    reference: 'preco',
                                    proximoFoco: 'acresdecres',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Custo'],
                                        ['1', 'Compra'],
                                        ['2', 'Venda'],
                                        ['3', 'Custo Médio']
                                    ],
                                    bind: {
                                        value: '{valuePreco}'
                                    }
                                },
                                {
                                    width: 130,
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    allowDecimals: true,
                                    fieldLabel: 'Percentual',
                                    reference: 'acresdecres',
                                    proximoFoco: 'acaoacrescrimo',
                                    bind: {
                                        value: '{percentualAcrescimoDecrescimo}'
                                    }
                                },
                                {
                                    width: 130,
                                    xtype: 'combobox',
                                    fieldLabel: 'Ajuste',
                                    reference: 'acaoacrescrimo',
                                    proximoFoco: 'grupoi',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Acréscimo'],
                                        ['1', 'Decréscimo']
                                    ],
                                    bind: {
                                        value: '{valueAcresDecrescimo}'
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
                                    proximoFoco: 'idgrupof',
                                    reference: 'grupoi',
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
                                    fieldLabel: 'Até',
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
