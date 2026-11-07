Ext.define('SamosAdmin.relatorios.comissoespro.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscomissoesprolist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.comissoespro.list.ViewController',
        'SamosAdmin.relatorios.comissoespro.list.ViewModel'
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
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Vendedor',
                                    tabela: 'usuarios',
                                    complement: 'idvendedor',
                                    reference: 'vendedor',
                                    proximoFoco: 'empresa',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['USUARIOS_ID',  'valueIdVendedor'],
                                    ],
                                    campoModelMostrarAposBuscar: 'USUARIOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdVendedor',
                                    itemId: 'idvendedor'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresa',
                                    reference: 'empresa',
                                    proximoFoco: 'inicio',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['EMPRESAS_ID',  'valueIdEmpresa'],
                                    ],
                                    campoModelMostrarAposBuscar: 'EMPRESAS_FANTASIA'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdEmpresa',
                                    itemId: 'idempresa'
                                }
                            ]
                        },     
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
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
