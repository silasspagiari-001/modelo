Ext.define('SamosAdmin.atualizacao.veiculos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'veiculossearch',

    requires: [
        'SamosAdmin.atualizacao.veiculos.search.ViewModel',
        'SamosAdmin.atualizacao.veiculos.search.ViewController'
    ],

    title: 'Veiculos',

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
            width: 80,
            text: 'Código',
            dataIndex: 'SERVICOS_ID',
            align: 'center'
        },
        {
            width: 100,
            text: 'Placa',
            dataIndex: 'VEICULO_PLACA',
            align: 'center'
        },            
        {
            width: 100,
            text: 'Tipo',
            dataIndex: 'VEICULO_TIPO',
            align: 'center'
        },            
        {
            flex: 1,
            text: 'Nome',
            dataIndex: 'SERVICOS_NOME'
        },
        {
            flex: false,
            width: 95,
            text: 'Preço',
            xtype: 'moneycolumn',
            align: 'right',
            dataIndex: 'SERVICOS_PRECO'
        }
    ]
});
