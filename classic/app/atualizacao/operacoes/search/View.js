Ext.define('SamosAdmin.atualizacao.operacoes.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'operacoessearch',

    requires: [
        'SamosAdmin.atualizacao.operacoes.search.ViewModel',
        'SamosAdmin.atualizacao.operacoes.search.ViewController'
    ],

    title: 'Operações',

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
            dataIndex: 'OPERACOES_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome',
            dataIndex: 'OPERACOES_NOME',
            flex : 1
        }
    ]
});
