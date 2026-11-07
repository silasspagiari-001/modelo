Ext.define('SamosAdmin.relatorios.bancos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosbancoslist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.bancos.list.ViewController',
        'SamosAdmin.relatorios.bancos.list.ViewModel'
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
                                    xtype: 'combobox',
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
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Aplicação',
                                    tabela: 'aplicacoes',
                                    complement: 'idaplicacaoi',
                                    reference: 'aplicacaoi',
                                    proximoFoco: 'aplicacaof',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['APLICACOES_ID',     'valueIdAplicacaoi'],
                                    ],
                                    campoModelMostrarAposBuscar: 'APLICACOES_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdAplicacaoi',
                                    itemId: 'idaplicacaoi'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até',
                                    tabela: 'aplicacoes',
                                    complement: 'idaplicacaof',
                                    reference: 'aplicacaof',
                                    proximoFoco: 'portadori',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['APLICACOES_ID',     'valueIdAplicacaof'],
                                    ],
                                    campoModelMostrarAposBuscar: 'APLICACOES_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdAplicacaof',
                                    itemId: 'idaplicacaof'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Banco',
                                    tabela: 'portadores',
                                    complement: 'idportadori',
                                    reference: 'portadori',
                                    proximoFoco: 'portadorf',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PORTADORES_ID',     'valueIdPortadori'],
                                    ],
                                    campoModelMostrarAposBuscar: 'PORTADORES_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPortadori',
                                    itemId: 'idportadori'
                                },
                                {
                                    flex: 3,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Até Banco',
                                    tabela: 'portadores',
                                    complement: 'idportadorf',
                                    reference: 'portadorf',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PORTADORES_ID',     'valueIdPortadorf'],
                                    ],
                                    campoModelMostrarAposBuscar: 'PORTADORES_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPortadorf',
                                    itemId: 'idportadorf'
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    },  

    toolbar: [
        
    ]
});
