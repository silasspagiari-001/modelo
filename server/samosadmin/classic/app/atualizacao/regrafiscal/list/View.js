Ext.define('SamosAdmin.atualizacao.regrafiscal.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'regrafiscal',

    requires: [
        'SamosAdmin.atualizacao.regrafiscal.form.View',
        'SamosAdmin.atualizacao.regrafiscal.list.ViewController',
        'SamosAdmin.atualizacao.regrafiscal.list.ViewModel'
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
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Código']
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
                flex: false,
                width: 100,
                text: 'Código',
                dataIndex: 'REGRAFISCAL_ID',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome',
                dataIndex: 'REGRAFISCAL_NOME'
            },
            {
                flex: 1,
                text: 'Origem',
                dataIndex: 'REGRAFISCAL_ORIGEM'
            },
            {
                flex: 1,
                text: 'Destino',
                dataIndex: 'REGRAFISCAL_DESTINO'
            },
            {
                flex: false,
                width: 93,
                text: 'Início',
                xtype: 'datecolumn',
                dataIndex: 'REGRAFISCAL_INICIO',
                align: 'center'
            },
            {
                flex: false,
                width: 93,
                text: 'Final',
                xtype: 'datecolumn',
                dataIndex: 'REGRAFISCAL_FINAL',
                align: 'center'
            }
        ]
    }
});
