Ext.define('SamosAdmin.atualizacao.empresas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'empresas',

    requires: [
        'SamosAdmin.atualizacao.empresas.form.View',
        'SamosAdmin.atualizacao.empresas.list.ViewController',
        'SamosAdmin.atualizacao.empresas.list.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Imprimir'
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
                dataIndex: 'EMPRESAS_ID',
                align: 'center'
            },
            {
                width: 155,
                text: 'CPF/CNPJ',
                xtype: 'cpfcnpjcolumn',
                dataIndex: 'EMPRESAS_CPFCNPJ'
            },
            {
                flex: 2.5,
                text: 'Razão Social',
                dataIndex: 'EMPRESAS_NOME'
            },
            {
                flex: 1.9,
                text: 'Fantasia',
                dataIndex: 'EMPRESAS_FANTASIA'
            },
            {
                width: 125,
                xtype: 'phonecolumn',
                text: 'Telefone',
                dataIndex: 'EMPRESAS_TELEFONE'
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
