Ext.define('SamosAdmin.atualizacao.profissoes.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'profissoessearch',

    requires: [
        'SamosAdmin.atualizacao.profissoes.search.ViewModel',
        'SamosAdmin.atualizacao.profissoes.search.ViewController'
    ],

    title: 'Profissões',

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
            dataIndex: 'PROFISSOES_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome da Profissão',
            dataIndex: 'PROFISSOES_NOME',
            flex : 2
        }
    ]
});
