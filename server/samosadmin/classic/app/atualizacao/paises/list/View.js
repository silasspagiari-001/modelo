Ext.define('SamosAdmin.atualizacao.paises.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'paises',

    requires: [
        'SamosAdmin.atualizacao.paises.form.View',
        'SamosAdmin.atualizacao.paises.list.ViewController',
        'SamosAdmin.atualizacao.paises.list.ViewModel'
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
                width: 100,
                text: 'Código',
                dataIndex: 'PAISES_ID',
                align: 'center'
            },
            {
                width: 100,
                text: 'Código do Pais',
                dataIndex: 'PAISES_CODIGO'
            },
            {
                flex: 8,
                text: 'Nome do Banco',
                dataIndex: 'PAISES_NOME'
            }
        ]
    }
});
