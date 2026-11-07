Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'romaneiosmoveisagendamontagemform',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.form.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.form.ViewController'
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
                                readOnly: true, //'{readOnly}',
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
                                readOnly: true //'{readOnly}'
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
                                readOnly: '{readOnly}',
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
                                value: '{model.MOVIMENTOSITENS_HORAMONTAGEM}',
                                readOnly: '{readOnly}'
                            }
                        }
                    ]
                }
            ]
        }
    ]
});
