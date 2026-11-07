Ext.define('SamosAdmin.atualizacao.profissoes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'profissoes',

    requires: [
        'SamosAdmin.atualizacao.profissoes.form.View',
        'SamosAdmin.atualizacao.profissoes.list.ViewController',
        'SamosAdmin.atualizacao.profissoes.list.ViewModel'
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
                width : 100,
                text: 'Código',
                dataIndex: 'PROFISSOES_ID',
                align: 'center'
            },
            {
                flex: 9,
                text: 'Nome da Profissão',
                dataIndex: 'PROFISSOES_NOME'
            }
        ]
    }
});
