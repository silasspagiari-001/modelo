Ext.define('SamosAdmin.relatorios.vendaspessoaprodutos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendaspessoaprodutoslist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.vendaspessoaprodutos.list.ViewController',
        'SamosAdmin.relatorios.vendaspessoaprodutos.list.ViewModel'
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
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Documento',
                                    reference: 'documento',
                                    proximoFoco: 'inicio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Orçamento'],
                                        ['2', 'Pedido'],
                                        ['3', 'Nota Eletrônica'],
                                        ['4', 'Requisição']
                                    ],
                                    bind: {
                                        value: '{valueDocumento}'
                                    }
                                },
                                {
                                    flex: 0.75,
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'inicio',
                                    proximoFoco: 'final',
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    flex: 0.75,
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
                                    proximoFoco: 'usuarioi',

                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                },
                                {
                                    flex: 0.75,
                                    xtype: 'combobox',
                                    fieldLabel: 'Vacina',
                                    reference: 'vacina',
                                    proximoFoco: 'prp',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Com Vacina'],
                                        ['2', 'Sem Vacina']
                                    ],
                                    bind: {
                                        value: '{valueVacina}'
                                    }
                                },
                                {
                                    flex: 0.75,
                                    xtype: 'combobox',
                                    fieldLabel: 'Só PRP',
                                    reference: 'prp',
                                    proximoFoco: 'usuarioi',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Sim'],
                                        ['2', 'Não']
                                    ],
                                    bind: {
                                        hidden: '{hideVacina}',                                        
                                        value: '{valuePRP}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
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
                                    fieldLabel: 'Até',
                                    tabela: 'grupos',
                                    complement: 'idgrupof',
                                    reference: 'grupof',
                                    proximoFoco: 'idprodutoi',
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
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutoi',
                                    reference: 'produtoi',
                                    proximoFoco: 'produtof',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                                        ['PRODUTOS_ID',   'PRODUTOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueProdutoi}'
                                    }
                                },
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutoi',
                                    itemId: 'idprodutoi',
                                    bind: {
                                        value: '{valueIdProdutoi}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'produtos',
                                    complement: 'idprodutof',
                                    reference: 'produtof',
                                    proximoFoco: 'idpessoai',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                                        ['PRODUTOS_ID',   'PRODUTOS_ID']
                                    ],
                                    bind: {
                                        value: '{valueProdutof}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutof',
                                    itemId: 'idprodutof',
                                    bind: {
                                        value: '{valueIdProdutof}'
                                    }
                                },
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
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
