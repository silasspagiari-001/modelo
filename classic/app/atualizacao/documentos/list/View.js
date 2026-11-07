Ext.define('SamosAdmin.atualizacao.documentos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'documentos',

    requires: [
        'SamosAdmin.atualizacao.documentos.form.View',
        'SamosAdmin.atualizacao.documentos.list.ViewController',
        'SamosAdmin.atualizacao.documentos.list.ViewModel'
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
                [2, 'Código']
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
                dataIndex: 'DOCUMENTOS_ID',
                width : 100,
                align: 'right'
            },
            {
                text: 'Nome',
                dataIndex: 'DOCUMENTOS_NOME',
                flex: 1
            }
        ]
    }
});
