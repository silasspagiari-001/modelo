Ext.define('SamosAdmin.atualizacao.portadores.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'portadores',

    requires: [
        'SamosAdmin.atualizacao.portadores.form.View',
        'SamosAdmin.atualizacao.portadores.list.ViewController',
        'SamosAdmin.atualizacao.portadores.list.ViewModel'
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
                [2, 'Fantasia'],
                [3, 'CPF/CNPJ'],
                [4, 'Código']
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
                flex: 0.7,
                text: 'Código',
                dataIndex: 'PORTADORES_ID',
                align: 'center'
            },
            {
                flex: 1.1,
                text: 'CNPJ',
                xtype: 'cpfcnpjcolumn',
                dataIndex: 'PORTADORES_CPFCNPJ'
            },
            {
                flex: 2.5,
                text: 'Razão Social',
                dataIndex: 'PORTADORES_NOME'
            },
            {
                flex: 1,
                text: 'Agência',
                dataIndex: 'PORTADORES_AGENCIA'
            },
            {
                flex: 1,
                text: 'Conta',
                dataIndex: 'PORTADORES_CONTA'
            },
            {
                flex: 1,
                xtype: 'phonecolumn',
                text: 'Telefone',
                dataIndex: 'PORTADORES_TELEFONE'
            },
            {
                flex: 2,
                text: 'Cidade',
                dataIndex: 'CIDADES_NOME'
            },
            {
                flex: 0.5,
                text: 'UF',
                dataIndex: 'CIDADES_ESTADO'
            }
        ]
    }
});
