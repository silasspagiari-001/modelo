Ext.define('SamosAdmin.atualizacao.servicos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'servicossearch',

    requires: [
        'SamosAdmin.atualizacao.servicos.search.ViewModel',
        'SamosAdmin.atualizacao.servicos.search.ViewController'
    ],

    title: 'Serviços',

    rightbuttons: [
        'Selecionar',
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
                [2, 'Código'],
                [3, 'Genérica']
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

    columns: [
        {
            width: 80,
            text: 'Código',
            dataIndex: 'SERVICOS_ID',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Nome',
            dataIndex: 'SERVICOS_NOME'
        },
        {
            flex: false,
            width: 95,
            text: 'Preço',
            xtype: 'moneycolumn',
            align: 'right',
            dataIndex: 'SERVICOS_PRECO'
        }
    ]
});
