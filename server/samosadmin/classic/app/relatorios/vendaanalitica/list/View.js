Ext.define('SamosAdmin.relatorios.vendaanalitica.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendaanaliticalist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.vendaanalitica.list.ViewController',
        'SamosAdmin.relatorios.vendaanalitica.list.ViewModel'
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
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresa',
                                    reference: 'empresa',
                                    proximoFoco: 'produtoi',
                                    buscarPor: 'Genérica',
                                    hidden: !configs.getFinanceiros().multiEmpresa,
                                    vmAssociations: [
                                        ['EMPRESAS_ID',       'valueIdEmpresa'],
                                        ['EMPRESAS_FANTASIA', 'valueEmpresa']
                                    ],
                                    campoModelMostrarAposBuscar: 'EMPRESAS_FANTASIA'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdEmpresa',
                                    itemId: 'idempresa'
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Documento',
                                    flex: 1,
                                    store: [
                                        [0, 'Pedido'],
                                        [1, 'Nota'],
                                        [2, 'SemQtde'],                        
                                    ],
                                    bind: {
                                        value: '{valueDocumento}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Ordem',
                                    flex: 1,
                                    store: [
                                        [0, 'Valor'],
                                        [1, 'Qtde']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inicio',
                                    reference: 'inicio',
                                    flex: 1,
                                    bind: {
                                        value: '{valueInicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
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
                                    fieldLabel: 'Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutoi',
                                    reference: 'produtoi',
                                    proximoFoco: 'produtof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID', 'valueIdProdutoi']
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutoi',
                                    itemId: 'idprodutoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'produtos',
                                    complement: 'idprodutof',
                                    reference: 'produtof',
                                    proximoFoco: 'grupoi',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID', 'valueIdProdutof']
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutof',
                                    itemId: 'idprodutof'
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
                                        ['GRUPOS_ID', 'valueIdGrupoi']
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
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
                                        ['GRUPOS_ID', 'valueIdGrupof']
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupof',
                                    itemId: 'idgrupof'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Fornecedor',
                                    tabela: 'pessoas',
                                    complement: 'idpessoas',
                                    reference: 'pessoa',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID', 'valueIdPessoas']
                                    ],
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoas',
                                    itemId: 'idpessoas'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Profissional',
                                    hidden: configs.getClientName() != 'lislais',
                                    tabela: 'usuarios',
                                    complement: 'idusuarios',
                                    reference: 'usuario',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['USUARIOS_ID', 'valueProfissional']
                                    ],
                                    campoModelMostrarAposBuscar: 'USUARIOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuarios',
                                    itemId: 'idusuarios'
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
