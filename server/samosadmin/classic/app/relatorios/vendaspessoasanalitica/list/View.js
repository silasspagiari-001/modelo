Ext.define('SamosAdmin.relatorios.vendaspessoasanalitica.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendaspessoasanaliticalist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.vendaspessoasanalitica.list.ViewController',
        'SamosAdmin.relatorios.vendaspessoasanalitica.list.ViewModel'
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
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'quebra',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    bind: {
                                        store: '{storeStatus}',
                                        value: '{valueStatus}'
                                    }
                                },
                                
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Só Vendas',
                                    reference: 'sovendas',
                                    proximoFoco: 'quebra',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    hidden: configs.getClientName() != 'herbiquimica',
                                    store: [
                                        ['1', 'Sim'],
                                        ['2', 'Não'],
                                        ['3', 'Entrega Futura'],
                                    ],
                                    bind: {
                                        value: '{valueSoVendas}'
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
                                    hidden: configs.getClientName() == 'prudenaco',
                                    bind: {
                                        value: '{valueQuebra}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Vacina',
                                    reference: 'vacina',
                                    proximoFoco: 'grupoi',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Com Vacina'],
                                        ['2', 'Sem Vacina'],
                                        ['3', 'Somente Vacina']
                                    ],
                                    bind: {
                                        hidden: '{hideVacina}',                                        
                                        value: '{valueVacina}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Cidade',
                                    xtype: 'textfield',
                                    bind: {
                                        value: '{valueCidade}'
                                    }
                                }
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
                                    fieldLabel: 'Código', //'IdPessoai',
                                    fieldStyle: 'text-align:right;',
                                    itemId: 'idpessoai',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    hidden: configs.getClientName() != 'prudenaco',  
                                    width: 65,                          
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
                                    hidden: configs.getClientName() != 'prudenaco',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    width: 65,
                                    fieldLabel: 'Código', //'IdPessoaf',
                                    fieldStyle: 'text-align:right;',
                                    itemId: 'idpessoaf',
                                    bind: {
                                        value: '{valueIdPessoaf}'
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
                                    hidden: configs.getClientName() == 'prudenaco',
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
                                    hidden: configs.getClientName() == 'prudenaco',                                    
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
                                    hidden: configs.getClientName() == 'prudenaco',
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
                                    hidden: configs.getClientName() == 'prudenaco',
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
