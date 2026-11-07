Ext.define('SamosAdmin.relatorios.margembrutafaturada.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosmargembrutafaturadalist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.margembrutafaturada.list.ViewController',
        'SamosAdmin.relatorios.margembrutafaturada.list.ViewModel'
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
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Ordem',
                                    reference: 'ordem',
                                    proximoFoco: 'inicio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Produto'],
                                        ['1', 'Documento'],
                                        ['2', 'Quantidade']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
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
                                    fieldLabel: 'Só PRP',
                                    reference: 'prp',
                                    proximoFoco: 'quebra',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Sim'],
                                        ['2', 'Não']
                                    ],
                                    bind: {
                                        hidden: '{hidePRP}',                                        
                                        value: '{valuePRP}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Quebra Vendedor',
                                    reference: 'quebra',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Não'],
                                        ['1', 'Sim']
                                    ],
                                    bind: {
                                        hidden: '{hideQuebra}',                                        
                                        value: '{valueQuebra}'
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
                                    proximoFoco: 'idprodutof',
                                    reference: 'produtoi',
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
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    hidden: configs.getClientName() == 'racaforte',
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
                                    hidden: configs.getClientName() == 'racaforte',
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
                                    fieldLabel: 'Vendedor',
                                    tabela: 'usuarios',
                                    complement: 'idusuarioi',
                                    proximoFoco: 'idusuariof',
                                    reference: 'usuarioi',
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
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    hidden: configs.getClientName() == 'racaforte',
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
                                }
                            ]
                        },                        
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Cliente',
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
                                    hidden: configs.getClientName() == 'racaforte',
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
                                    fieldLabel: 'Fornecedor',
                                    tabela: 'pessoas',
                                    complement: 'idfornecedori',
                                    proximoFoco: 'idfornecedorf',
                                    reference: 'fornecedori',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valueFornecedori}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdFornecedori',
                                    itemId: 'idfornecedori',
                                    bind: {
                                        value: '{valueIdFornecedori}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'pessoas',
                                    complement: 'idfornecedorf',
                                    reference: 'fornecedorf',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    hidden: configs.getClientName() == 'racaforte',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{valueFornecedorf}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdFornecedorf',
                                    itemId: 'idfornecedorf',
                                    bind: {
                                        value: '{valueIdFornecedorf}'
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