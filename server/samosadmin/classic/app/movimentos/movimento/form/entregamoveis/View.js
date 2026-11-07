Ext.define('SamosAdmin.movimentos.movimento.form.entregamoveis.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentosentregamoveis',

    requires: [
        'SamosAdmin.movimentos.movimento.form.entregamoveis.ViewModel',
        'SamosAdmin.movimentos.movimento.form.entregamoveis.ViewController'
    ],

    title: 'Entrega/Montagem',
    hidePaging: true,
    width: 720,
    height: 270,

    leftbuttons: [
        'Alterar',
        'Imprimir'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {   
                            items: [
                                {
                                    xtype: 'datefield',
                                    width: 140,
                                    flex: false,
                                    fieldLabel: 'Data Entrega',
                                    reference: 'dataentrega',
                                    proximoFoco: 'turnoentrega',
                                    bind: {
                                        ui: '{temNumeroEntrega ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{readOnly || temNumeroEntrega}',
                                        value: '{model.MOVIMENTOSITENS_DATAENTREGA}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Turno Entrega',
                                    emptyText: '',
                                    reference: 'turnoentrega',
                                    proximoFoco: 'datamontagem',
                                    editable: false,
                                    displayField: 'field2',
                                    forceSelection: true,
                                    hideTrigger: true,                                    
                                    store: [
                                        ['M', 'Manhã'],
                                        ['T', 'Tarde'],
                                        ['N', 'Noite']
                                    ],
                                    bind: {
                                        ui: '{temNumeroEntrega ? "field-readonly" : "textbold-' + tema + '"}',
                                        value: '{model.MOVIMENTOSITENS_HORAENTREGA}',
                                        readOnly: '{readOnly || temNumeroEntrega}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 75,
                                    fieldLabel: 'Romaneio',
                                    reference: 'romaneioentrega',
                                    proximoFoco: 'serie',
                                    fieldStyle:'text-align:right;color:red;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOSENTREGA_NUMERO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 300,
                                    fieldLabel: 'Entregador',
                                    reference: 'entregador',
                                    proximoFoco: 'serie',
                                    fieldStyle:'color:black;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOSENTREGA_NOME}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    items: [
                        {   
                            items: [
                                {
                                    xtype: 'datefield',
                                    width: 140,
                                    flex: false,
                                    fieldLabel: 'Data Montagem',
                                    reference: 'datamontagem',
                                    proximoFoco: 'turnomontagem',
                                    bind: {
                                        ui: '{!temMontagem || temNumeroMontagem ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{!temMontagem || readOnly || temNumeroMontagem}',
                                        value: '{model.MOVIMENTOSITENS_DATAMONTAGEM}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Turno Montagem',
                                    emptyText: '',
                                    reference: 'turnomontagem',
                                    proximoFoco: 'gravar',
                                    displayField: 'field2',
                                    editable: false,
                                    forceSelection: true,
                                    hideTrigger: true,                                    
                                    store: [
                                        ['M', 'Manhã'],
                                        ['T', 'Tarde'],
                                        ['N', 'Noite']
                                    ],
                                    bind: {
                                        ui: '{!temMontagem || temNumeroMontagem ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{!temMontagem || readOnly || temNumeroMontagem}',
                                        value: '{model.MOVIMENTOSITENS_HORAMONTAGEM}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 75,
                                    fieldLabel: 'Romaneio',
                                    reference: 'romaneiomontagem',
                                    proximoFoco: 'serie',
                                    fieldStyle:'text-align:right;color:red;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOSMONTAGEM_NUMERO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 300,
                                    fieldLabel: 'Montador',
                                    reference: 'montador',
                                    proximoFoco: 'serie',
                                    fieldStyle:'color:black;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOSMONTAGEM_NOME}'
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
