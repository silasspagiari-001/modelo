Ext.define('SamosAdmin.atualizacao.montagens.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'montagenssearch',

    requires: [
        'SamosAdmin.atualizacao.montagens.search.ViewModel',
        'SamosAdmin.atualizacao.montagens.search.ViewController'
    ],

    title: 'Montagens',

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
            text: 'Código',
            dataIndex: 'MONTAGENS_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Descrição Montagem',
            dataIndex: 'MONTAGENS_NOME',
            flex : 2
        },
        {
            text: 'Valor',
            dataIndex: 'MONTAGENS_VALOR',
            xtype: 'moneycolumn',
            align: 'right',
            flex : 1,
            hidden: (configs.getProdutos().labelMontagem && configs.getProdutos().labelMontagem == 'Ordem')
        }

    ]
});
