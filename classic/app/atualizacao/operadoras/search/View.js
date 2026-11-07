Ext.define('SamosAdmin.atualizacao.operadoras.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'operadorassearch',

    requires: [
        'SamosAdmin.atualizacao.operadoras.search.ViewModel',
        'SamosAdmin.atualizacao.operadoras.search.ViewController'
    ],

    title: 'Operadoras',

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
            width: 70,
            text: 'Código',
            dataIndex: 'OPERADORAS_ID',
            align: 'center'
        },
        {
            flex: 1,
            text: 'Nome',
            dataIndex: 'OPERADORAS_NOME'
        },
        {
            flex: false,
            width: 150,
            text: 'À Vista',
            xtype: 'moneycolumn',
            dataIndex: 'OPERADORAS_AVISTA'
        },
        {
            flex: false,
            width: 150,
            text: 'Parcelado',
            xtype: 'moneycolumn',
            dataIndex: 'OPERADORAS_PARCELADO'
        }
    ]
});
