Ext.define('SamosAdmin.atualizacao.paises.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'paisessearch',

    requires: [
        'SamosAdmin.atualizacao.paises.search.ViewModel',
        'SamosAdmin.atualizacao.paises.search.ViewController'
    ],

    title: 'Países',

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
            dataIndex: 'PAISES_ID',
            width: 100,
            align: 'right'
        },
        {
            text: 'Código Pais',
            dataIndex: 'PAISES_CODIGO',
            width: 100
        },
        {
            text: 'Nome do Banco',
            dataIndex: 'PAISES_NOME',
            flex : 8
        }
    ]
});
