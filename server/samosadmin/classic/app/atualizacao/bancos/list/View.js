Ext.define('SamosAdmin.atualizacao.bancos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'bancos',

    requires: [
        'SamosAdmin.atualizacao.bancos.form.View',
        'SamosAdmin.atualizacao.bancos.list.ViewController',
        'SamosAdmin.atualizacao.bancos.list.ViewModel'
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
                [1, 'Contéudo'],
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
                flex: 1,
                text: 'Código',
                align: 'center',
                dataIndex: 'BANCOS_ID'
            },
            {
                flex: 9,
                text: 'Nome do Banco',
                dataIndex: 'BANCOS_NOME'
            }
        ]
    }
});
