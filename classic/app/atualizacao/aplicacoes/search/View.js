Ext.define('SamosAdmin.atualizacao.aplicacoes.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'aplicacoessearch',

    requires: [
        'SamosAdmin.atualizacao.aplicacoes.search.ViewModel',
        'SamosAdmin.atualizacao.aplicacoes.search.ViewController'
    ],

    title: 'Aplicações',

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
            fieldLabel: 'Razão',
            width: 135,
            store: [
                [0, 'Analítica'],
                [1, 'Sintética']
            ]
        },
        {
            fieldLabel: 'Tipo',
            width: 135,
            store: [
                [0, 'Todas'],
                [1, 'Receita'],
                [2, 'Despesa'],
                [3, 'Custos'],
                [4, 'Deduções']
            ]
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    columns: [
        {
            text: 'Máscara',
            dataIndex: 'APLICACOES_MASCARA',
            width: 100,
            align: 'center'
        },
        {
            text: 'Nome da Aplicação',
            dataIndex: 'APLICACOES_NOME',
            flex : 2
        },
        {
            text: 'Reduzido',
            dataIndex: 'APLICACOES_ID',
            width: 100,
            align: 'right'
        }
    ]
});
