Ext.define('SamosAdmin.atualizacao.usuarios.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'usuariossearch',

    requires: [
        'SamosAdmin.atualizacao.usuarios.search.ViewModel',
        'SamosAdmin.atualizacao.usuarios.search.ViewController'
    ],

    title: 'Usuário',

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
                [1, 'Conteúdo'],
                [2, 'Login'],
                [3, 'CPF'],
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
            text: 'Código',
            dataIndex: 'USUARIOS_ID',
            width: 100,
            align: 'right'
        },
        {
            text: 'Nome',
            dataIndex: 'USUARIOS_NOME',
            flex: 20
        },
        {
            text: 'CPF/CNPJ',
            dataIndex: 'USUARIOS_CPFCNPJ',
            flex:10
        },
        {
            text: 'Cidade',
            dataIndex: 'CIDADES_NOME',
            flex : 10
        },
        {
            text: 'UF',
            dataIndex: 'CIDADES_ESTADO',
            flex : 3
        }
    ]
});
