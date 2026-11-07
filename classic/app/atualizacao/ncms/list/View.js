Ext.define('SamosAdmin.atualizacao.ncms.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ncms',

    requires: [
        'SamosAdmin.atualizacao.ncms.form.View',
        'SamosAdmin.atualizacao.ncms.list.ViewController',
        'SamosAdmin.atualizacao.ncms.list.ViewModel'
    ],

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
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
                [3, 'Ncm']
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

    columns: {
        items: [
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
                flex:1
            }
        ]
    }
});
