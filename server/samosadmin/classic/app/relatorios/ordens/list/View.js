Ext.define('SamosAdmin.relatorios.ordens.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosordenslist',

    modelName: 'SamosAdmin.movimentos.ordens.Model',

    requires: [
        'SamosAdmin.relatorios.ordens.list.ViewController',
        'SamosAdmin.relatorios.ordens.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function(){
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
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    complement: 'idpessoa',
                                    reference: 'pessoa',
                                    proximoFoco: 'inicio',
                                    callbackFn: 'onBuscarClick',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',        'valueIdPessoa'],
                                        ['PESSOAS_NOME',      'valuePessoa']
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
                                    xtype: 'combobox',
                                    forceSelection: true,
                                    editable: false,
                                    fieldLabel: 'Ordem',
                                    flex: 1,
                                    store: [
                                        [0, 'Emissão'],
                                        [1, 'Pessoas'],
                                        [2, 'Número'],
                                        [3, 'Faturamento'],
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
                                    store: configs.getOrdens().status,
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