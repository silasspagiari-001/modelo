Ext.define('SamosAdmin.atualizacao.servicos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'servicos',

    requires: [
        'SamosAdmin.atualizacao.servicos.form.View',
        'SamosAdmin.atualizacao.servicos.list.ViewController',
        'SamosAdmin.atualizacao.servicos.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Conteúdo',
            flex: 1,
            emptyText: '[F2] - Ajuda na busca'
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
                width: 80,
                text: 'Controle',
                dataIndex: 'SERVICOS_ID',
                align: 'center'
            },
            {
                width: 240,
                text: 'Código',
                dataIndex: 'SERVICOS_CODIGO',
                align: 'center'
            },            
            {
                flex: 3,
                text: 'Nome',
                dataIndex: 'SERVICOS_NOME'
            },
            {
                flex: false,
                width: 100,
                text: '% ISS',
                dataIndex: 'SERVICOS_ISS'
            },
            {
                flex: false,
                width: 100,
                text: 'Preço',
                xtype: 'moneycolumn',
                align: 'right',
                dataIndex: 'SERVICOS_PRECO'
            }
        ]
    }
});
