Ext.define('SamosAdmin.relatorios.movimentoscfop.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosmovimentoscfoplist',

    modelName: 'SamosAdmin.movimentos.movimento.Model',

    requires: [
        'SamosAdmin.relatorios.movimentoscfop.list.ViewController',
        'SamosAdmin.relatorios.movimentoscfop.list.ViewModel'
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
                                    fieldLabel: 'Pessoa',
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
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'CFOP 1',
                                    xtype: 'textfield',
                                    maxLength: 4,
                                    bind: {
                                        value: '{valueCfopa}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'CFOP 2',
                                    xtype: 'textfield',
                                    maxLength: 4,
                                    bind: {
                                        value: '{valueCfopb}'
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
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }            
});
