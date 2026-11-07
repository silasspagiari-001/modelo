Ext.define('SamosAdmin.relatorios.lucratividade.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioslucratividadelist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.lucratividade.list.ViewController',
        'SamosAdmin.relatorios.lucratividade.list.ViewModel'
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
                    xtype: 'container',
                    items: [
                        {
                            xtype: 'container',
                            layout: 'hbox',
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
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Vendedor',
                                    tabela: 'usuarios',
                                    complement: 'idusuario',
                                    reference: 'usuario',
                                    proximoFoco: 'produtoi',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['USUARIOS_ID',       'valueIdUsuario'],
                                    ],
                                    campoModelMostrarAposBuscar: 'USUARIOS_NOME'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [           
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuario',
                                    itemId: 'idusuario'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Produto',
                                    tabela: 'produtos',
                                    complement: 'idprodutoi',
                                    reference: 'produtoi',
                                    proximoFoco: 'produtof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID',  'valueIdProdutoi'],
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutoi',
                                    itemId: 'idprodutoi'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'produtos',
                                    complement: 'idprodutof',
                                    reference: 'produtof',
                                    proximoFoco: 'grupoi',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PRODUTOS_ID',  'valueIdProdutof'],
                                    ],
                                    campoModelMostrarAposBuscar: 'PRODUTOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdProdutof',
                                    itemId: 'idprodutof'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupoi',
                                    reference: 'grupoi',
                                    proximoFoco: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',  'valueIdGrupoi'],
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupoi',
                                    itemId: 'idgrupoi'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Grupo',
                                    tabela: 'grupos',
                                    complement: 'idgrupof',
                                    reference: 'grupof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['GRUPOS_ID',  'valueIdGrupof'],
                                    ],
                                    campoModelMostrarAposBuscar: 'GRUPOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdGrupof',
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
