Ext.define('SamosAdmin.relatorios.vendacomparativa.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendacomparativalist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.vendacomparativa.list.ViewController',
        'SamosAdmin.relatorios.vendacomparativa.list.ViewModel'
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
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'datainicio',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Pessoas'],
                                        [1, 'Produtos']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'datainicio',
                                    proximoFoco: 'datafinal',                                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}' 
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'datafinal',    
                                    proximoFoco: 'ordem',                                                                    
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
                                    xtype: 'combobox',
                                    fieldLabel: 'Ordem',
                                    reference: 'ordem',
                                    proximoFoco: 'cidade',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Alfabética'],
                                        [1, 'Valor']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Município',
                                    reference: 'cidade',
                                    tabela: 'cidades',
                                    complement: 'idcidade',
                                    proximoFoco: 'produto',
                                    buscarPor: 'Genérica',                                   
                                    vmAssociations: [
                                        ['CIDADES_ID',       'codcidade']
                                    ],
                                    campoModelMostrarAposBuscar: 'CIDADES_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codcidade',
                                    itemId: 'idcidade'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Produto',
                                    reference: 'produto',
                                    tabela: 'produtos',
                                    complement: 'idproduto',
                                    proximoFoco: 'pessoai',
                                    buscarPor: 'Genérica',                                   
                                    vmAssociations: [
                                        ['PRODUTOS_ID',  'codproduto']
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codproduto',
                                    itemId: 'idproduto'
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
                                        ['PESSOAS_ID',       'codpessoai']
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
                                        ['PESSOAS_ID',       'codpessoaf']
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
                                        ['GRUPOS_ID',       'codgrupoi']
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
                                        ['GRUPOS_ID',       'codgrupof']
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },
                                {
                                    hidden: true,
                                    reference: 'codgrupof',
                                    itemId: 'idgrupof'
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
