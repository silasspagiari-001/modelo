Ext.define('SamosAdmin.atualizacao.bancos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'bancossearch',

    requires: [
        'SamosAdmin.atualizacao.bancos.search.ViewModel',
        'SamosAdmin.atualizacao.bancos.search.ViewController'
    ],

    title: 'Bancos',

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
            dataIndex: 'BANCOS_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome do Banco',
            dataIndex: 'BANCOS_NOME',
            flex : 2
        }
    ]
});
