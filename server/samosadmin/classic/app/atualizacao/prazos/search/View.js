Ext.define('SamosAdmin.atualizacao.prazos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'prazossearch',

    requires: [
        'SamosAdmin.atualizacao.prazos.search.ViewModel',
        'SamosAdmin.atualizacao.prazos.search.ViewController'
    ],

    title: 'Prazos',

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
            text: 'Código',
            dataIndex: 'PRAZOS_ID',
            width : 100,
            align: 'right'
        },
        {
            text: 'Nome do Prazo',
            dataIndex: 'PRAZOS_NOME',
            flex : 1
        },
        {
            flex: false,
            width: 100,
            text: 'Parcelas',
            align: 'center',
            dataIndex: 'PRAZOS_PARCELAS'
        }
    ],

    footPanel: [
        {
            xtype: 'label',
            flex: 1,
            padding: '0 0 0 15',
            style : 'font-weight: bold;color:blue;',
            bind: {
                text: '({gridprazossearch.selection.PRAZOS_PARCELAMENTO}) '
            }
        }
    ]            

});
