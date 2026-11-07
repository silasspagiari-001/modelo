Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosmoveisagendaentregaform',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.form.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.form.ViewController'
    ],

    title: 'Agendamento',
    width: 310,
    height: 233,

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function() {
        const tema = configs.getTema();
        
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {   
                            items: [
                                {
                                    xtype: 'datefield',
                                    flex: false,
                                    width: 135,
                                    fieldLabel: 'Data Entrega',
                                    reference: 'dataentrega',
                                    proximoFoco: 'turnoentrega',
                                    bind: {
                                        readOnly: '{readOnly}',
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
                                        value: '{model.MOVIMENTOSITENS_HORAENTREGA}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    xtype: 'datefield',
                                    flex: false,
                                    width: 135,
                                    fieldLabel: 'Data Montagem',
                                    reference: 'datamontagem',
                                    proximoFoco: 'turnomontagem',
                                    bind: {
                                        ui: '{!temMontagem ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{!temMontagem || readOnly}',
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
                                        ui: '{!temMontagem ? "field-readonly" : "textbold-' + tema + '"}',
                                        readOnly: '{!temMontagem || readOnly}',
                                        value: '{model.MOVIMENTOSITENS_HORAMONTAGEM}'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        })
        
        this.callParent(arguments);
    }
});
