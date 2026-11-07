Ext.define('SamosAdmin.atualizacao.transportes.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'transportessearch',

    requires: [
        'SamosAdmin.atualizacao.transportes.search.ViewModel',
        'SamosAdmin.atualizacao.transportes.search.ViewController'
    ],

    title: 'Transportes',

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
});
