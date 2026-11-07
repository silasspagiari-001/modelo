Ext.define('SamosAdmin.atualizacao.sinteticas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'sinteticas',

    requires: [
        'SamosAdmin.atualizacao.sinteticas.form.View',
        'SamosAdmin.atualizacao.sinteticas.list.ViewController',
        'SamosAdmin.atualizacao.sinteticas.list.ViewModel'
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
    columns: {
        items: [
            {
                flex: 1,
                text: 'Máscara',
                dataIndex: 'APLICACOES_MASCARA',
                align: 'center'
            },
            {
                flex: 7,
                text: 'Nome da Aplicação Sintética',
                dataIndex: 'APLICACOES_NOME'
            },
            {
                flex: 2,
                text: 'Tipo',
                dataIndex: 'APLICACOES_TIPO',
                renderer: function(value, meta, record) {
                   if (value === 'D') {
                        return 'Despesa';
                   } else if (value === 'R') {
                        return 'Receita';
                   } else if (value === 'C') {
                       return 'Custos';
                   } else if (value === 'U') {
                       return 'Deduções';
                   }
                }
            },
            {
                flex: 1,
                text: 'Reduzido',
                dataIndex: 'APLICACOES_ID',
                align: 'center'
            }
        ]
    }
});
