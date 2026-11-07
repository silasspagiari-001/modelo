Ext.define('SamosAdmin.relatorios.vendaperiodo.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendaperiodolist',

    requires: [
        'SamosAdmin.relatorios.vendaperiodo.list.ViewController',
        'SamosAdmin.relatorios.vendaperiodo.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
        //'Teste'
    ],

    rightbuttons: [
        'Sair'
    ],

    
    constructor: function (cfg) {

        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo de Documento',
                                    reference: 'tipo',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: 
                                    [
                                        ['3',  'Notas Fiscais'],
                                        ['2',  'Pedidos'],
                                        ['4',  'Requisições' ],
                                        ['11', 'Cupom Fiscal' ],
                                        ['1',  'Orçamentos' ],
                                        ['5',  'Notas de Entrada']                                      
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
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
                                        ['0', 'Sem Quebra'],
                                        ['1', 'Com Quebra']
                                    ],
                                    bind: {
                                        value: '{valueQuebra}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Operação',
                                    reference: 'vendas',
                                    proximoFoco: 'usuarioi',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Tudo'],
                                        [1, 'Vendas'],
                                        [6, 'Bonificações'],
                                        [2, 'Transferências'],
                                        [3, 'Devoluções'],
                                        [4, 'Cancelados'],
                                        [5, 'Denegados']
                                    ],
                                    bind: {
                                        value: '{valueOperacao}'
                                    }
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Itens',
                                    reference: 'itensmovimento',
                                    proximoFoco: 'pessoai',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Sem itens'],
                                        ['1', 'Com itens']
                                    ],
                                    bind: {
                                        value: '{valueItens}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Vacina',
                                    reference: 'vacina',
                                    proximoFoco: 'pessoai',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Com Vacina'],
                                        ['1', 'Sem Vacina']
                                    ],
                                    bind: {
                                        hidden:'{hideVacina}', 
                                        value: '{valueVacina}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'pessoai',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Todos'],
                                        ['1', 'Com NF-e'],
                                        ['2', 'Sem NF-e'],
                                        ['3', 'Baixados'],
                                        ['4', 'Abertos'],
                                        ['5', 'Sem NF-e Abertos'],
                                    ],
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
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo de Cliente',
                                    reference: 'tipo',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: configs.getPessoas().tipos,
                                    hidden: configs.getClientName() != 'cirurcenter',
                                    bind: {
                                        value: '{valueTipoCliente}'
                                    }
                                },



                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão de',
                                    reference: 'emiinicio',
                                    flex: 1,
                                    bind: {
                                        value: '{valueEmiinicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão até',
                                    reference: 'emifinal',                                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueEmifinal}'
                                    }
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codpessoai',
                                    itemId: 'idpessoai',
                                    bind: {
                                        fieldLabel: '{valueTipo == 2 ? "Código A" : "Código"}',
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'pessoas',
                                    reference: 'pessoai',
                                    proximoFoco: 'pessoaf',
                                    buscarPor: 'Genérica',
                                    complement: 'idpessoai',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {                                        
                                        fieldLabel: '{valueTipo == 2 ? "Pessoa A" : "Pessoa Inicial"}',
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',  
                                    reference: 'codpessoaf',                                  
                                    readOnly: true,
                                    itemId: 'idpessoaf',
                                    bind: {
                                        fieldLabel: '{valueTipo == 2 ? "Código B" : "Código"}',
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'pessoas',
                                    reference: 'pessoaf',
                                    proximoFoco: 'portadori',
                                    buscarPor: 'Genérica',
                                    complement: 'idpessoaf',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {                                        
                                        fieldLabel: '{labelpessoaf}',   // fieldLabel: '{valueTipo == 2 ? "Pessoa B" : "Pessoa Final"}',
                                    }                                        
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código',
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codgrupoi',
                                    itemId: 'idgrupoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Grupo Inicial',
                                    tabela: 'grupos',
                                    reference: 'grupoi',
                                    proximoFoco: 'grupof',
                                    buscarPor: 'Genérica',
                                    complement: 'idgrupoi',
                                    associations: [
                                        ['GRUPOS_NOME', 'GRUPOS_NOME'],
                                        ['GRUPOS_ID',   'GRUPOS_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codgrupof',
                                    itemId: 'idgrupof'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Grupo Final',
                                    tabela: 'grupos',
                                    reference: 'grupof',
                                    proximoFoco: 'produtoi',
                                    buscarPor: 'Genérica',
                                    complement: 'idgrupof',
                                    associations: [
                                        ['GRUPOS_NOME', 'GRUPOS_NOME'],
                                        ['GRUPOS_ID',   'GRUPOS_ID']
                                    ]                        
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código',
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codprodutoi',
                                    itemId: 'idprodutoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Produto Inicial',
                                    tabela: 'produtos',
                                    reference: 'produtoi',
                                    proximoFoco: 'produtof',
                                    buscarPor: 'Genérica',
                                    complement: 'idprodutoi',
                                    associations: [
                                        ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                                        ['PRODUTOS_ID',   'PRODUTOS_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codprodutof',
                                    hidden: configs.getClientName() == 'racaforte',
                                    itemId: 'idprodutof'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Produto Final',
                                    tabela: 'produtos',
                                    reference: 'produtof',
                                    proximoFoco: 'vendedori',
                                    buscarPor: 'Genérica',
                                    complement: 'idprodutof',
                                    hidden: configs.getClientName() == 'racaforte',
                                    associations: [
                                        ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                                        ['PRODUTOS_ID',   'PRODUTOS_ID']
                                    ]                        
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código',
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codusuarioi',
                                    itemId: 'idusuarioi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Vendedor Inicial',
                                    tabela: 'usuarios',
                                    reference: 'usuarioi',
                                    proximoFoco: 'usuariof',
                                    buscarPor: 'Genérica',
                                    complement: 'idusuarioi',
                                    associations: [
                                        ['USUARIOS_NOME', 'USUARIOS_NOME'],
                                        ['USUARIOS_ID',   'USUARIOS_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    flex: 1,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codusuariof',
                                    hidden: configs.getClientName() == 'racaforte',
                                    itemId: 'idusuariof'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Vendedor Final',
                                    tabela: 'usuarios',
                                    reference: 'usuariof',
                                    buscarPor: 'Genérica',
                                    complement: 'idusuariof',
                                    hidden: configs.getClientName() == 'racaforte',
                                    associations: [
                                        ['USUARIOS_NOME', 'USUARIOS_NOME'],
                                        ['USUARIOS_ID',   'USUARIOS_ID']
                                    ]                        
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
