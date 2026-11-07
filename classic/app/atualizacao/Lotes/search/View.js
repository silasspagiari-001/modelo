Ext.define('SamosAdmin.atualizacao.lotes.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'lotessearch',

    requires: [
        'SamosAdmin.atualizacao.lotes.search.ViewModel',
        'SamosAdmin.atualizacao.lotes.search.ViewController'
    ],

    title: 'Lotes',
    width: 900,

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    toolbar: [
        {
            fieldLabel: 'Conteúdo',
            flex: 1
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Produto',
            tabela: 'produtos',
            complement: 'idproduto',
            reference: 'produto',
            proximoFoco: 'inicio',
            callbackFn: 'onBuscarClick',
            buscarPor: 'Genérica',
            associations: [
                ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                ['PRODUTOS_ID',   'PRODUTOS_ID']
            ]           
        },        
        {
            width: 70,
            readOnly: true,
            fieldLabel: 'IdProduto',
            itemId: 'idproduto'
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Inicio',
            width: 126
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 126
        },        
        {
            fieldLabel: 'Ordem',
            width: 120,
            store: [
                [0, 'Descrição'],
                [1, 'Contéudo'],
                [2, 'Lote'],
                [3, 'Fabricação'],
                [4, 'Validade'],
                [5, 'Produto']                
            ]
        },
/*        {
            fieldLabel: 'Status',
            width: 100,
            store: [
                [0, 'Ativos'],
                [1, 'Inativos'],
                [2, 'Todos']
            ]
        },*/
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],

    columns: [
        {
            text: 'Código',
            dataIndex: 'LOTES_ID',
            width: 85,
            align: 'right'
        },
        {
            text: 'Produto',
            dataIndex: 'LOTES_ID_PRODUTOS',
            width: 95,
            align: 'right'
        },
        {
            text: 'Descrição',
            dataIndex: 'PRODUTOS_NOME',
            flex : 1
        },
        {
            text: 'Lote',
            dataIndex: 'LOTES_REFERENCIA',
            align: 'center',
            width: 110
        },
        {
            width: 93,
            text: 'Fabricação',
            xtype: 'datecolumn',
            dataIndex: 'LOTES_FABRICACAO',
            align: 'center'
        },
        {
            flex: false,
            width: 93,
            text: 'Validade',
            xtype: 'datecolumn',
            dataIndex: 'LOTES_VALIDADE',
            align: 'center'
        },
        {
            flex: false,
            width: 80,
            text: 'Saldo',
            align: 'right',
            dataIndex: 'SALDO_LOTES'
        }
    ]
});
