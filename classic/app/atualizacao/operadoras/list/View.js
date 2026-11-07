Ext.define('SamosAdmin.atualizacao.operadoras.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'operadoras',

    requires: [
        'SamosAdmin.atualizacao.operadoras.form.View',
        'SamosAdmin.atualizacao.operadoras.list.ViewController',
        'SamosAdmin.atualizacao.operadoras.list.ViewModel'
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
                [2, 'Código'],
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
                dataIndex: 'OPERADORAS_AVISTA'
            },
            {
                flex: false,
                width: 150,
                text: 'Parcelado',
                dataIndex: 'OPERADORAS_PARCELADO'
            }
        ]
    }
});
