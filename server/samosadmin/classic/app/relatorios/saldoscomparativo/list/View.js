Ext.define('SamosAdmin.relatorios.saldoscomparativo.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriossaldoscomparativolist',

    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    requires: [
        'SamosAdmin.relatorios.saldoscomparativo.list.ViewController',
        'SamosAdmin.relatorios.saldoscomparativo.list.ViewModel'
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
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Preço',
                                    width: 105,
                                    hidden: !(configs.getUsuario().tipo == 'C' || configs.getUsuario().tipo == 'F'),
                                    store: [
                                        [0, 'Venda'],
                                        [1, 'Custo'],
                                        [2, 'Compra']        
                                    ],
                                    bind: {
                                        value: '{valuePreco}'
                                    }
                                },
                                {
                                    flex: 2,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresai',
                                    reference: 'empresai',
                                    proximoFoco: 'empresaf',
                                    buscarPor: 'Genérica',
                                    hidden: !(configs.getUsuario().tipo == 0 || configs.getUsuario().tipo == 6),
                                    vmAssociations: [
                                        ['EMPRESAS_ID',   'valueIdEmpresai']
                                    ],
                                    valorPadraoAposLimpar: 1,
                                    campoModelMostrarAposBuscar: 'EMPRESAS_FANTASIA',
                                    bind: {
                                        value: '{valueEmpresai}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdEmpresai',
                                    itemId: 'idempresai'
                                },
                                {
                                    flex: 2,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresaf',
                                    reference: 'empresaf',
                                    proximoFoco: 'pessoai',
                                    buscarPor: 'Genérica',
                                    hidden: !(configs.getUsuario().tipo == 0 || configs.getUsuario().tipo == 6),
                                    vmAssociations: [
                                        ['EMPRESAS_ID',   'valueIdEmpresaf']
                                    ],
                                    valorPadraoAposLimpar: 999,
                                    campoModelMostrarAposBuscar: 'EMPRESAS_FANTASIA',
                                    bind: {
                                        value: '{valueEmpresaf}'
                                    }
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdEmpresaf',
                                    itemId: 'idempresaf'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 2,
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
                                    flex: 2,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Fornecedor',
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
                            items: [
                                {
                                    flex: 2,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupoi',
                                    reference: 'grupoi',
                                    proximoFoco: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',   'valueIdGrupoi']
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
                                    flex: 2,
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
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Status',
                                    width: 105,
                                    store: configs.getProdutos().status,
                                    bind: {
                                        value: '{valueStatus}'
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
