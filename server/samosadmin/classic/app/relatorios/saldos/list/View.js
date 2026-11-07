Ext.define('SamosAdmin.relatorios.saldos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriossaldoslist',

    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    requires: [
        'SamosAdmin.relatorios.saldos.list.ViewController',
        'SamosAdmin.relatorios.saldos.list.ViewModel'
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
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: '',
                                    reference: 'auditoria',
                                    bind: {
                                        value: '{valueAuditoria}',
                                    },
                                    hidden: configs.getClientName() != 'prudenmoveis',
                                    xtype: 'checkbox',
/*                                    inputValue: 'T',
                                    uncheckedValue: 'F',*/
                                    boxLabel: 'Para Auditoria',
                                    checked: true
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    store: [
                                        [0, 'Com Saldo Positivo'],
                                        [1, 'Com Saldo Negativo'],
                                        [2, 'Com Saldo Zerado'],
                                        [3, 'Com Saldo Positivo ou Negativo'],
                                        [4, 'Todos os Produtos'],
                                        [5, 'Abaixo do Mínimo'],
                                        [6, 'Acima do Máximo'],
                                        [7, 'Com Peso Bruto'],
                                        [8, 'Sem Peso Bruto'],
                                        [9, 'Com Margem'],
                                        [10, 'Sem Margem']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Preço',
                                    width: 110,
                                    store: [
                                        [0, 'Venda'],
                                        [1, 'Custo'],
                                        [2, 'Compra'],
                                        [3, 'Sem Qtde']
                                    ],
                                    bind: {
                                        value: '{valuePreco}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Status',
                                    width: 110,
                                    store: configs.getProdutos().status,
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Ordem',
                                    hidden: configs.getClientName() != 'turbotec',
                                    flex: 1,
                                    store: [
                                        [0, 'Alfabética'],
                                        [1, 'Código Fábrica/Alfabética']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                            ]
                        },                        
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Fornecedor',
                                    tabela: 'pessoas',
                                    complement: 'idpessoai',
                                    reference: 'pessoai',
                                    proximoFoco: 'pessoaf',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',   'valueIdPessoai']
                                    ],
                                    valorPadraoAposLimpar: 1,
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME',
                                    bind: {
                                        value: '{valuePessoai}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoai',
                                    itemId: 'idpessoai'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'pessoas',
                                    complement: 'idpessoaf',
                                    reference: 'pessoaf',
                                    proximoFoco: 'grupoi',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',   'valueIdPessoaf']
                                    ],
                                    valorPadraoAposLimpar: 999999,
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME',
                                    bind: {
                                        value: '{valuePessoaf}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoaf',
                                    itemId: 'idpessoaf'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
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
                                        ['GRUPOS_ID', 'valueIdGrupoi']
                                    ],
                                    valorPadraoAposLimpar: 1,
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME',
                                    bind: {
                                        value: '{valueGrupoi}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupoi',
                                    itemId: 'idgrupoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupof',
                                    reference: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',   'valueIdGrupof']
                                    ],
                                    valorPadraoAposLimpar: 999999,
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME',
                                    bind: {
                                        value: '{valueGrupof}'
                                    }
                                },                 
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupof',        
                                    itemId: 'idgrupof'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
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
                                        ['PRODUTOS_ID', 'valueIdProdutoi']
                                    ],
                                    valorPadraoAposLimpar: 1,
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME',
                                    bind: {
                                        value: '{valueProdutoi}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutoi',
                                    itemId: 'idprodutoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutof',
                                    reference: 'produtof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID',   'valueIdProdutof']
                                    ],
                                    valorPadraoAposLimpar: 9999999,
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME',
                                    bind: {
                                        value: '{valueProdutof}'
                                    }
                                },                 
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutof',        
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
