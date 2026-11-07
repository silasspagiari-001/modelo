Ext.define('SamosAdmin.atualizacao.relacoes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relacoes',

    requires: [
        'SamosAdmin.atualizacao.relacoes.form.View',
        'SamosAdmin.atualizacao.relacoes.list.ViewController',
        'SamosAdmin.atualizacao.relacoes.list.ViewModel'
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
            emptyText: '',
            flex: 3
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Produto'],
                [3, 'Código']
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
                width: 90,
                text: 'Código',
                dataIndex: 'RELACOES_ID',
                align: 'right'
            },
            {
                flex: 1,
                text: 'Produto Web',
                dataIndex: 'RELACOES_ID_PRODUTOS',
                align: 'center'
            }
        ]
    }
});
