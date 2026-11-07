Ext.define('SamosAdmin.atualizacao.cidades.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'cidadessearch',

    requires: [
        'SamosAdmin.atualizacao.cidades.search.ViewModel',
        'SamosAdmin.atualizacao.cidades.search.ViewController'
    ],

    title: 'Cidades',

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
                [3, 'IBGE'],
                [4, 'Genérica']
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
            dataIndex: 'CIDADES_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome da Cidade',
            dataIndex: 'CIDADES_NOME',
            flex : 7
        },
        {
            text: 'Estado',
            dataIndex: 'CIDADES_ESTADO',
            flex : 1
        },
        {
            text: 'IBGE',
            dataIndex: 'CIDADES_IBGE',
            flex : 1
        }
    ]
});
