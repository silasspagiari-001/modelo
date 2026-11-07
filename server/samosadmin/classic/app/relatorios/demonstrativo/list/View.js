Ext.define('SamosAdmin.relatorios.demonstrativo.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosdemonstrativolist',

    modelName: 'SamosAdmin.atualizacao.empresas.Model',

    requires: [
        'SamosAdmin.relatorios.demonstrativo.list.ViewController',
        'SamosAdmin.relatorios.demonstrativo.list.ViewModel'
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
                                    proximoFoco: 'aplicacao',
                                    buscarPor: 'Genérica',
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
                                    fieldLabel: 'Aplicação',
                                    tabela: 'aplicacoes',
                                    complement: 'idaplicacao',
                                    reference: 'aplicacao',
                                    proximoFoco: 'inicio',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['APLICACOES_ID',       'valueIdAplicacao'],
                                    ],
                                    campoModelMostrarAposBuscar: 'APLICACOES_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdAplicacao',
                                    itemId: 'idaplicacao'
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
                                        [0, 'Analítico'],
                                        [1, 'Sintético']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },  
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
