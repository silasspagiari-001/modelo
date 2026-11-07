Ext.define('SamosAdmin.relatorios.comprasicmsfrete.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatorioscomprasicmsfretelist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.compras.list.ViewController',
        'SamosAdmin.relatorios.compras.list.ViewModel'
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
                                    flex: 2,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresa',
                                    reference: 'empresa',
                                    proximoFoco: 'buscar',
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
                                    flex: 2,
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
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }            
});
