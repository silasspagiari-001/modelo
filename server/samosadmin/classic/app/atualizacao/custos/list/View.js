Ext.define('SamosAdmin.atualizacao.custos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'custos',

    requires: [
        'SamosAdmin.atualizacao.custos.form.View',
        'SamosAdmin.atualizacao.custos.list.ViewController',
        'SamosAdmin.atualizacao.custos.list.ViewModel'
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
            flex: 3
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Código'],
                [3, 'Máscara']
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
                flex: 1,
                text: 'Código',
                dataIndex: 'CUSTOS_ID',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Máscara',
                dataIndex: 'CUSTOS_MASCARA',
                align: 'center'
            },
            {
                flex: 7,
                text: 'Nome do Centro de Custo',
                dataIndex: 'CUSTOS_NOME'
            },
            {
                flex: 2,
                text: 'Tipo',
                dataIndex: 'CUSTOS_TIPO',
                renderer: function(value, meta, record) {
                   if (value === 'D') {
                        return 'Despesa';
                   } else if (value === 'R') {
                        return 'Receita';
                   } else if (value === 'S') {
                        return 'Despesa Sintética';            
                    } else if (value === 'E') {
                        return 'Receita Sintética';
                    }
                }
            }
        ]
    }
});
