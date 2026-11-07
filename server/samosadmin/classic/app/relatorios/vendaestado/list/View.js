Ext.define('SamosAdmin.relatorios.vendaestado.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendaestadolist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.vendaestado.list.ViewController',
        'SamosAdmin.relatorios.vendaestado.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
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
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Documento',
                                    reference: 'documento',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Pedidos'],
                                        [1, 'Notas'],
                                        [2, 'Requisições'],
                                        [3, 'Cupons Fiscais'],
                                        [4, 'Orçamentos']                        
                                    ],
                                    bind: {
                                        value: '{valueDocumento}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Estado',
                                    reference: 'estado',
                                    proximoFoco: 'buscar',
                                    forceSelection: false,
                                    editable: false,                                            
                                    displayField: 'field1',
                                    store: Object.keys(SamosUtils.Info.getEstados()).concat(['Todos']),
                                    bind: {
                                        value: '{valueEstado}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'De',
                                    reference: 'datainicio',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Até',
                                    reference: 'datafinal',                                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Pessoa',
                                    reference: 'pessoai',
                                    tabela: 'pessoas',
                                    complement: 'idpessoai',
                                    proximoFoco: 'pessoaf',
                                    buscarPor: 'Genérica',                                   
                                    vmAssociations: [
                                        ['PESSOAS_ID', 'codpessoai']
                                    ],
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codpessoai',
                                    itemId: 'idpessoai'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoaf',
                                    reference: 'pessoaf',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID', 'codpessoaf']
                                    ],
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codpessoaf',
                                    itemId: 'idpessoaf'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupoi',
                                    reference: 'grupoi',
                                    proximoFoco: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID', 'codgrupoi']
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codgrupoi',
                                    itemId: 'idgrupoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupof',
                                    reference: 'grupof',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID', 'codgrupof']
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codgrupof',
                                    itemId: 'idgrupof'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutoi',
                                    reference: 'produtoi',
                                    proximoFoco: 'produtof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID', 'codprodutoi']
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codprodutoi',
                                    itemId: 'idprodutoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutof',
                                    reference: 'produtof',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID', 'codprodutof']
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codprodutof',
                                    itemId: 'idprodutof'
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
