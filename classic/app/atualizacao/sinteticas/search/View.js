Ext.define('SamosAdmin.atualizacao.sinteticas.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'sinteticassearch',

    requires: [
        'SamosAdmin.atualizacao.sinteticas.search.ViewModel',
        'SamosAdmin.atualizacao.sinteticas.search.ViewController'
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
                [0, 'Despesa'],
                [1, 'Receita']
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
