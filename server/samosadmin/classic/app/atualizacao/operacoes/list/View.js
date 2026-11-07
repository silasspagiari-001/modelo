Ext.define('SamosAdmin.atualizacao.operacoes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'operacoes',

    requires: [
        'SamosAdmin.atualizacao.operacoes.form.View',
        'SamosAdmin.atualizacao.operacoes.list.ViewController',
        'SamosAdmin.atualizacao.operacoes.list.ViewModel'
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
                flex: false,
                width: 100,
                text: 'Código',
                dataIndex: 'OPERACOES_ID',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome',
                dataIndex: 'OPERACOES_NOME'
            }
        ]
    }
});
