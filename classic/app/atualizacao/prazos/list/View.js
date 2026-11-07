Ext.define('SamosAdmin.atualizacao.prazos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'prazos',

    requires: [
        'SamosAdmin.atualizacao.prazos.form.View',
        'SamosAdmin.atualizacao.prazos.list.ViewController',
        'SamosAdmin.atualizacao.prazos.list.ViewModel'
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
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Código']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 135,
            store: [
                [0, 'Ativos'],
                [1, 'Inativos'],
                [2, 'Todos']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    columns: {
        items: [
            {
                width: 90,
                text: 'Código',
                dataIndex: 'PRAZOS_ID',
                align: 'center'
            },
            {
                flex: 2,
                text: 'Nome do Prazo',
                dataIndex: 'PRAZOS_NOME'
            },
            {
                flex: 1,
                text: 'Acréscimo',
                xtype: 'moneycolumn',
                align: 'right',
                dataIndex: 'PRAZOS_ACRESCIMO'
            },
            {
                flex: 1,
                text: 'Desconto',
                xtype: 'moneycolumn',
                align: 'right',
                dataIndex: 'PRAZOS_DESCONTO'
            },
            {
                flex: 1,
                text: 'Parcelas',
                align: 'center',
                dataIndex: 'PRAZOS_PARCELAS'
            }
        ]
    }
});
