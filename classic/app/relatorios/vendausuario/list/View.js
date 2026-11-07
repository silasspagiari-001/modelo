Ext.define('SamosAdmin.relatorios.vendausuario.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosvendausuariolist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.vendausuario.list.ViewController',
        'SamosAdmin.relatorios.vendausuario.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function (config) {
        const tema = configs.getTema();

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
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    store: [
                                        [0, 'Sintético'],
                                        [1, 'Analítico']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Documento',
                                    flex: 1,
                                    store: [
                                        [1, 'Orçamento'],
                                        [2, 'Pedido'],
                                        [3, 'Nota'],
                                        [4, 'Requisição']
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
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresa',
                                    reference: 'empresa',
                                    proximoFoco: 'usuario',
                                    buscarPor: 'Genérica',
                                    hidden: (configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado),
                                    vmAssociations: [
                                        ['EMPRESAS_ID',       'valueIdEmpresa']
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
                                    fieldLabel: 'Vendedor',
                                    tabela: 'usuarios',
                                    complement: 'idusuario',
                                    reference: 'usuario',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['USUARIOS_ID',       'valueIdUsuario']
                                    ],
                                    campoModelMostrarAposBuscar: 'USUARIOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuario',
                                    itemId: 'idusuario'
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
