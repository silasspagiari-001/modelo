Ext.define('SamosAdmin.relatorios.comissoesfin.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscomissoesfinlist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.comissoesfin.list.ViewController',
        'SamosAdmin.relatorios.comissoesfin.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        const hideTipo = configs.getClientName() == 'lislais';
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
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    hidden: hideTipo,
                                    store: [
                                        [0, 'Sintético'],
                                        [1, 'Analítico']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    hidden: configs.getClientName() == 'lislais',
                                    flex: 1,
                                    bind: {
                                        value: '{valueEmissao}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Final',
                                    reference: 'final',
                                    hidden: configs.getClientName() == 'lislais',
                                    flex: 1,
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Período',
                                    reference: 'periodo',
                                    hidden: configs.getClientName() != 'lislais',
                                    flex: 1,
                                    bind: {
                                        value: '{valuePeriodo}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Até',
                                    reference: 'ate',
                                    hidden: configs.getClientName() != 'lislais',                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueAte}'
                                    }
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 2,
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
                                }
                            ]  
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 2,
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
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Ordem',
                                    flex: 1,
                                    hidden: !hideTipo,
                                    store: [
                                        [0, 'Vencimento'],
                                        [1, 'Pagamento']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Status',
                                    flex: 1,
                                    hidden: !hideTipo,
                                    store: [
                                        [0, 'Pagos'],
                                        [1, 'Abertos'],
                                        [2, 'Todos']
                                    ],
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
