Ext.define('SamosAdmin.atualizacao.documentos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'documentossearch',

    requires: [
        'SamosAdmin.atualizacao.documentos.search.ViewModel',
        'SamosAdmin.atualizacao.documentos.search.ViewController'
    ],

    title: 'Documentos',

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
                [1, 'Conteúdo'],
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
            dataIndex: 'DOCUMENTOS_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome',
            dataIndex: 'DOCUMENTOS_NOME',
            flex: 15
        },

    ]
});
