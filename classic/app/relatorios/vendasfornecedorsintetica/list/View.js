Ext.define('SamosAdmin.relatorios.vendasfornecedorsintetica.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendasfornecedorsinteticalist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.vendasfornecedorsintetica.list.ViewController',
        'SamosAdmin.relatorios.vendasfornecedorsintetica.list.ViewModel'
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
                                    fieldLabel: 'Ordem',
                                    reference: 'ordem',
                                    proximoFoco: 'preco',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Grupos'],
                                        ['2', 'Pessoas']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Preço',
                                    reference: 'preco',
                                    proximoFoco: 'preco',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Compra'],
                                        ['2', 'Custo'],
                                        ['3', 'Venda']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1.3,
                                    xtype: 'combobox',
                                    fieldLabel: 'Sem Bonif/Amostra',
                                    reference: 'bonificacao',
                                    proximoFoco: 'prp',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Com Bonif/Amostra'],
                                        ['2', 'Sem Bonif/Amostra']
                                    ],
                                    bind: {
                                        hidden: '{hideVacina}',
                                        value: '{valueBonificacao}'
                                    }
                                },

                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoai',
                                    proximoFoco: 'idpessoaf',
                                    reference: 'pessoai',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valuePessoai}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoai',
                                    itemId: 'idpessoai',
                                    bind: {
                                        value: '{valueIdPessoai}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'pessoas',
                                    complement: 'idpessoaf',
                                    reference: 'pessoaf',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valuePessoaf}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoaf',
                                    itemId: 'idpessoaf',
                                    bind: {
                                        value: '{valueIdPessoaf}'
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
