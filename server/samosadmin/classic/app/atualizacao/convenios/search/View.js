Ext.define('SamosAdmin.atualizacao.grupos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'grupossearch',

    requires: [
        'SamosAdmin.atualizacao.grupos.search.ViewModel',
        'SamosAdmin.atualizacao.grupos.search.ViewController'
    ],

    title: 'Grupos',

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
            dataIndex: 'GRUPOS_ID',
            width: 100,
            align: 'right'
        },
        {
            text: 'Nome do Grupo',
            dataIndex: 'GRUPOS_NOME',
            flex : 2
        }
    ]
});
