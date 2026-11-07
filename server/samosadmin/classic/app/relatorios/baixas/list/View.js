Ext.define('SamosAdmin.relatorios.baixas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosbaixaslist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.baixas.list.ViewController',
        'SamosAdmin.relatorios.baixas.list.ViewModel'
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
                                    flex: 1.3,
                                    xtype: 'combobox',
                                    fieldLabel: 'Financeiro',
                                    reference: 'financeiro',
                                    proximoFoco: 'inicio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Receber'],
                                        ['2', 'Pagar']
                                    ],
                                    bind: {
                                        value: '{valueFinanceiro}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'inicio',
                                    proximoFoco: 'final',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
                                    proximoFoco: 'usuarioi',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Quebra',
                                    reference: 'quebra',
                                    proximoFoco: 'usuarioi',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Com Quebra'],
                                        ['2', 'Sem Quebra']
                                    ],
                                    bind: {
                                        value: '{valueQuebra}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1.3,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Vendedor',
                                    tabela: 'usuarios',
                                    complement: 'idusuarioi',
                                    reference: 'usuarioi',
                                    proximoFoco: 'usuariof',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOME', 'USUARIOS_NOME'],
                                        ['USUARIOS_ID',   'USUARIOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueUsuarioi}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuarioi',
                                    itemId: 'idusuarioi',
                                    bind: {
                                        value: '{valueIdUsuarioi}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'usuarios',
                                    complement: 'idusuariof',
                                    reference: 'usuariof',
                                    proximoFoco: 'grupoi',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOME', 'USUARIOS_NOME'],
                                        ['USUARIOS_ID',   'USUARIOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueUsuariof}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuariof',
                                    itemId: 'idusuariof',
                                    bind: {
                                        value: '{valueIdUsuariof}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Portador',
                                    tabela: 'portadores',
                                    complement: 'idportadori',
                                    reference: 'portadori',
                                    proximoFoco: 'portadorf',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PORTADORES_NOME', 'PORTADORES_NOME'],
                                        ['PORTADORES_ID',   'PORTADORES_ID']
                                    ],
                                    bind: {
                                        value: '{valuePortadori}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPortadori',
                                    itemId: 'idportadori',
                                    bind: {
                                        value: '{valueIdPortadori}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'portadores',
                                    complement: 'idportadorf',
                                    reference: 'portadorf',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PORTADORES_NOME', 'PORTADORES_NOME'],
                                        ['PORTADORES_ID',   'PORTADORES_ID']
                                    ],
                                    bind: {
                                        value: '{valuePortadorf}'
                                    }
                                },
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPortadorf',
                                    itemId: 'idportadorf',
                                    bind: {
                                        value: '{valueIdPortadorf}'
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
