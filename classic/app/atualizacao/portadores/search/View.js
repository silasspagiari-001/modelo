Ext.define('SamosAdmin.atualizacao.portadores.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'portadoressearch',

    requires: [
        'SamosAdmin.atualizacao.portadores.search.ViewModel',
        'SamosAdmin.atualizacao.portadores.search.ViewController'
    ],

    title: 'Portadores',

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
                [2, 'Fantasia'],
                [3, 'CPF/CNPJ'],
                [4, 'Código'],
                [5, 'Genérica']
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
            text: 'Portador',
            dataIndex: 'PORTADORES_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Banco',
            dataIndex: 'PORTADORES_ID_BANCOS',
            width : 80,
            align: 'right'
        },
        {
            text: 'Nome',
            dataIndex: 'BANCOS_NOME',
            flex : 5
        },
        {
            text: 'Nome do Portador',
            dataIndex: 'PORTADORES_NOME',
            flex : 6
        },
        {
            text: 'Agencia',
            dataIndex: 'PORTADORES_AGENCIA',
            flex : 2.5
        },
        {
            text: 'Conta',
            dataIndex: 'PORTADORES_CONTA',
            flex : 3.5
        },
    ]
});
