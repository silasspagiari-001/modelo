Ext.define('SamosAdmin.atualizacao.ncms.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ncmssearch',

    requires: [
        'SamosAdmin.atualizacao.ncms.search.ViewModel',
        'SamosAdmin.atualizacao.ncms.search.ViewController'
    ],

    title: 'Ncm',

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
                [3, 'Ncm'],
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
            dataIndex: 'NCMS_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome',
            dataIndex: 'NCMS_NOME',
            flex: 1
        },
        {
            text: 'Ncm',
            dataIndex: 'NCMS_NCM',
            flex: 1
        }
    ]
});
