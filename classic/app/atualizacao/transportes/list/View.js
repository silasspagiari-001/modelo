Ext.define('SamosAdmin.atualizacao.transportes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'transportes',

    requires: [
        'SamosAdmin.atualizacao.transportes.form.View',
        'SamosAdmin.atualizacao.transportes.list.ViewController',
        'SamosAdmin.atualizacao.transportes.list.ViewModel'
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
                dataIndex: 'TRANSPORTES_ID',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome do Transporte',
                dataIndex: 'TRANSPORTES_NOME'
            },
            {
                flex: false,
                width: 150,
                text: 'CPF/CNPJ',
                dataIndex: 'TRANSPORTES_CPFCNPJ'
            },
            {
                flex: false,
                width: 200,
                text: 'Cidade',
                dataIndex: 'CIDADES_NOME'
            },
            {
                flex: false,
                width: 100,
                text: 'Estado',
                dataIndex: 'CIDADES_ESTADO'
            }
        ]
    }
});
