Ext.define('SamosAdmin.relatorios.comprasproduto.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscomprasprodutolist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.comprasproduto.list.ViewController',
        'SamosAdmin.relatorios.comprasproduto.list.ViewModel'
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
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresa',
                                    reference: 'empresa',
                                    proximoFoco: 'grupo',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['EMPRESAS_ID',   'valueIdEmpresa']
                                    ],
                                    campoModelMostrarAposBuscar: 'EMPRESAS_FANTASIA'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdEmpresa',
                                    itemId: 'idempresa'
                                },                                
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupo',
                                    reference: 'grupo',
                                    proximoFoco: 'pessoa',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',   'valueIdGrupo']
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupo',
                                    itemId: 'idgrupo'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Fornecedor',
                                    tabela: 'pessoas',
                                    complement: 'idpessoa',
                                    reference: 'pessoa',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',   'valueIdPessoa']
                                    ],
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoa',
                                    itemId: 'idpessoa'
                                }
                            ]
                        },
                        {
                            items: [
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
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    hidden: (configs.getClientName() == 'herbiquimica' ||
                                             configs.getClientName() == 'prudenaco' ),
                                    flex: 1,
                                    store: [
                                        [0, 'Com Sugestão'],
                                        [1, 'Tudo']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                }, 
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    fieldLabel: 'Meses',
                                    reference: 'meses',
                                    hidden: (configs.getClientName() == 'herbiquimica' ||
                                             configs.getClientName() == 'prudenaco' ),
                                    flex: 1,
                                    store: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
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
