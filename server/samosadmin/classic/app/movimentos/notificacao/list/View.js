Ext.define('SamosAdmin.movimentos.notificacao.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'notificacao',

    requires: [
        'SamosAdmin.movimentos.notificacao.form.View',
        'SamosAdmin.movimentos.notificacao.list.ViewController',
        'SamosAdmin.movimentos.notificacao.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Conteúdo',
            flex: 3
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Título'],
                [1, 'Mensagem'],
                [2, 'Origem'],
                [3, 'Destino'],
                [5, 'Data Criação'],
                [6, 'Data Avisar'],
                [4, 'Genérica']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 135,
            store: [
                [0, 'Não Lida'],
                [1, 'Lida'],
                [2, 'Reagendada'],
                [3, 'Enviadas'],
                [4, 'Recebidas'],
                [5, 'Todas']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    
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
                width : 105,
                text: 'Data',
                dataIndex: 'NOTIFICACAO_DATAAVISAR',
                xtype: 'datecolumn',
                align: 'center'
            },
            {
                width : 75,
                text: 'Hora',
                dataIndex: 'NOTIFICACAO_HORAAVISAR',
                align: 'center'
            },
            {
                width : 118,
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
                text: 'De',
                dataIndex: 'USUARIOS_NOMEORIGEM',
                width : 150
            },
            {
                text: 'Para',
                dataIndex: 'USUARIOS_NOMEDESTINO',
                width : 150
            },
            {
                text: 'Descrição',
                dataIndex: 'NOTIFICACAO_NOME',
                flex : 1
            }
        ]
    }
});
