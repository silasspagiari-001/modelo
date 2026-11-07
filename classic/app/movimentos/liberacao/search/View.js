Ext.define('SamosAdmin.movimentos.liberacao.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'liberacaosearch',

    requires: [
        'SamosAdmin.movimentos.liberacao.search.ViewModel',
        'SamosAdmin.movimentos.liberacao.search.ViewController'
    ],

    title: 'Liberações',

    leftbuttons: [
        'Liberar',
        'Recusar'
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
                    if (value === 'F') {
                        return 'Recusada';
                    } else if (value === 'T') {
                        return 'Liberada';
                    } else if (value === 'P') {
                        return 'Pendente';
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
