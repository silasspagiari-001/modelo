Ext.define('SamosAdmin.relatorios.romaneios.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosromaneioslist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model', // manter o model de empresas por enquanto.

    requires: [
        'SamosAdmin.relatorios.romaneios.list.ViewController',
        'SamosAdmin.relatorios.romaneios.list.ViewModel'
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
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    complement: 'idempresa',
                                    reference: 'empresa',
                                    proximoFoco: 'pessoa',
                                    buscarPor: 'Genérica',
                                    hidden: configs.getClientName() == 'hospitalar',
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
                                    fieldLabel: 'Transportadora',
                                    tabela: 'transportes',
                                    complement: 'idtransporte',
                                    reference: 'transporte',
                                    proximoFoco: 'pessoa',
                                    buscarPor: 'Genérica',
                                    hidden: configs.getClientName() != 'hospitalar',
                                    vmAssociations: [
                                        ['TRANSPORTES_ID',       'valueIdTransporte']
                                    ],
                                    campoModelMostrarAposBuscar: 'TRANSPORTES_NOME'

                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdTransporte',
                                    itemId: 'idtransporte'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoa',
                                    reference: 'pessoa',
                                    proximoFoco: 'inicio',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',       'valueIdPessoa']
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
                            xtype: 'container',
                            layout: 'hbox',
                            items: [  
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Início',
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
                                }, 
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Ordem',
                                    flex: 1,
                                    store: [
                                        [0, 'Emissão'],
                                        [1, 'Pessoa'],
                                        [2, 'Número']
                                    ],
                                    bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    flex: 1,
                                    hidden: configs.getClientName() == 'hospitalar',
                                    store: [
                                        [0, 'Imediata Entregue'],
                                        [1, 'Imediata A Entregar'],
                                        [2, 'Normal Entregue'],
                                        [3, 'Normal A Entregar'],
                                        [4, 'Todos']
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
