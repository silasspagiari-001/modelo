Ext.define('SamosAdmin.movimentos.notificacao.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'notificacaosearch',

    requires: [
        'SamosAdmin.movimentos.notificacao.search.reagendamento.View',
        'SamosAdmin.movimentos.notificacao.search.ViewModel',
        'SamosAdmin.movimentos.notificacao.search.ViewController'
    ],

    title: 'Notificações',

    leftbuttons: [
        'Marcar lida',
        'Reagendar'
    ],
    
    rightbuttons: [
        {
            xtype: 'datefield',
            fieldLabel: 'Início',
            ui: 'textbold-' + configs.getTema(),
            width: 135,
            flex: false,
            bind: {
                value: '{valueInicio}'
            }
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            ui: 'textbold-' + configs.getTema(),
            width: 135,
            flex: false,
            bind: {
                value: '{valueFinal}'
            }
        },
        'Buscar',
        'Sair'
    ],

    width: 950,  // 765
    height: 550, // 442
    hidePaging: true,
    flexForm: false,
    checkSelection: true,
    selecionarPrimeiroAposBuscar: false,
    
    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('NOTIFICACAO_STATUS') === 'N') {
                return "nao-lido-row";
            } else if (record.get('NOTIFICACAO_STATUS') === 'L') {
                return "lido-row";
            } else if (record.get('NOTIFICACAO_STATUS') === 'R') {
                return "reagendado-row";
            }
        }
    },

    columns: {
        items: [
            {
                width : 92,
                text: 'Data',
                dataIndex: 'NOTIFICACAO_DATAAVISAR',
                xtype: 'datecolumn',
                align: 'center'
            },
            {
                width : 55,
                text: 'Hora',
                dataIndex: 'NOTIFICACAO_HORAAVISAR',
                align: 'center'
            },
            {
                width : 103,
                text: 'Status',
                dataIndex: 'NOTIFICACAO_STATUS',
                renderer: function(value, meta) {
                    if (value === 'N') {
                        return 'Não Lida';
                    } else if (value === 'L') {
                        return 'Lida';
                    } else if (value === 'R') {
                        return 'Reagendada';
                    } 
                }
            },
            {
                text: 'Origem',
                dataIndex: 'USUARIOS_NOMEORIGEM',
                width : 115
            },
            {
                text: 'Descrição',
                dataIndex: 'NOTIFICACAO_NOME',
                flex : 1
            }
        ]
    },

    formgroups: [
        {
            height: 280,  // 130
            title: 'Mensagem',
            collapsible: false,
            scrollable: true,
            items: [
                {
                    xtype: 'textareafield', //'displayfield',
                    anchor: '100%',
                    grow  : true,
                    width : '100%',
                    labelAlign: 'top',
                    readOnly: true,
                    height: 200, // 230
                    fieldStyle: {
                        padding: '0px !important',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    },
                    style: {
                        padding: '0px !important',
                        margin: '0px 5px !important'
                    },
                    bind: {
                        value: '{mensagem}'
                    }
                }
            ]
        }
    ]
});
