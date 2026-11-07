Ext.define('SamosAdmin.relatorios.ordemcarregamento.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosordemcarregamentolist',

    modelName: 'SamosAdmin.movimentos.ordens.Model',

    requires: [
        'SamosAdmin.relatorios.ordemcarregamento.list.ViewController',
        'SamosAdmin.relatorios.ordemcarregamento.list.ViewModel'
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
                                    fieldLabel: 'Usuario',
                                    tabela: 'usuarios',
                                    complement: 'idusuario',
                                    reference: 'usuario',
                                    proximoFoco: 'notainicio',
                                    callbackFn: 'onBuscarClick',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['USUARIOS_ID',        'valueIdUsuario'],
                                        ['USUARIOS_NOME',      'valueUsuario']
                                    ],
                                    campoModelMostrarAposBuscar: 'USUARIOS_NOME'
                                },                
                                {
                                    hidden: true,
                                    fieldLabel: 'IdUsuario',
                                    itemId: 'idusuario'
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            layout: 'hbox',
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    allowDecimals: true,
                                    fieldLabel: 'NF-e Inicial',
                                    reference: 'inicial',
                                    proximoFoco: 'final',
                                    bind: {
                                        value: '{inicial}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    allowDecimals: true,
                                    fieldLabel: 'NF-e Final',
                                    reference: 'final',
                                    bind: {
                                        value: '{final}'
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