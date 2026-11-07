Ext.define('SamosAdmin.movimentos.liberacao.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'liberacao',

    requires: [
        'SamosAdmin.movimentos.liberacao.form.View',
        'SamosAdmin.movimentos.liberacao.list.ViewController',
        'SamosAdmin.movimentos.liberacao.list.ViewModel'
    ],

    leftbuttons: [
//      'Novo'
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
                [0, 'Pendente'],
                [1, 'Autorizada'],
                [2, 'Não Autorizada'],
                [3, 'Todas']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    
    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('NOTIFICACAO_STATUS') === 'P') {
                return "pendente-row";
            } else if (record.get('NOTIFICACAO_STATUS') === 'T') {
                return "autorizada-row";
            } else if (record.get('NOTIFICACAO_STATUS') === 'F') {
                return "negada-row";
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
                    if (value === 'P') {
                        return 'Pendente';
                    } else if (value === 'T') {
                        return 'Autorizada';
                    } else if (value === 'F') {
                        return 'Negada';
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
