Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'ordensproducaoformulas',

    requires: [
        'SamosAdmin.movimentos.ordensproducao.formulas.form.View',
        'SamosAdmin.movimentos.ordensproducao.formulas.list.ViewController',
        'SamosAdmin.movimentos.ordensproducao.formulas.list.ViewModel'
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
            emptyText: '',
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
            hidden: true,
            fieldLabel: 'IdProduto',
            itemId: 'idproduto'
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Nome'],
                [1, 'Contéudo'],
                [2, 'Produto'],
                [3, 'Código']
            ]
        },
        {
            fieldLabel: 'Status',
            width: 150,
            store: [
                [0, 'Ativas'],
                [1, 'Inativas'],
                [2, 'Todas']
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
                width: 90,
                text: 'Produto',
                dataIndex: 'PRODUCOESFORMULAS_ID_PRODUTOS',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Nome Produto',
                dataIndex: 'PRODUTOS_NOME'
            },
            {
                flex: 1,
                text: 'Descrição',
                dataIndex: 'PRODUCOESFORMULAS_NOME'
            }
        ]
    }
});
