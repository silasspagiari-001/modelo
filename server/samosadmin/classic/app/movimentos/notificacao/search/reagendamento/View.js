Ext.define('SamosAdmin.movimentos.notificacao.search.reagendamento.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'notificacaoreagendamento',

    requires: [
        'SamosAdmin.movimentos.notificacao.search.reagendamento.ViewModel',
        'SamosAdmin.movimentos.notificacao.search.reagendamento.ViewController'
    ],

    rightbuttons: [
        'Gravar',
        'Sair'
    ],

    title: 'Reagendamento',
    height: 231,
    width: 248,

    formgroups: [
        {
            items: [
                {
                    items: [
                        {
                            flex: 1,
                            xtype: 'datefield',
                            fieldLabel: 'Data Avisar',
                            proximoFoco: 'horaavisar',
                            reference: 'dataavisar',
                            bind: {
                                readOnly: '{readOnly}',
                                value: '{dataAvisar}'
                            }
                        }
                    ]
                },
                {
                    items: [
                        {
                            fieldLabel: 'Hora Avisar',
                            flex: 1,
                            xtype: 'combobox',
                            reference: 'horaavisar',
                            proximoFoco: 'enviarpara',
                            bind: {
                                readOnly: '{readOnly}',
                                value: '{horaAvisar}',
                            },
                            store: SamosUtils.Info.getHorarios(),
                            forceSelection: true,
                            enableKeyEvents: true
                        }
                    ]
                }
            ]
        }
    ]
});
