Ext.define('SamosAdmin.consultas.comprasvendaspessoa.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'comprasvendaspessoa',

    requires: [
        'SamosAdmin.consultas.comprasvendaspessoa.list.ViewController',
        'SamosAdmin.consultas.comprasvendaspessoa.list.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,

    toolbar: [
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Pessoa',
            tabela: 'pessoas',
            complement: 'idpessoa',
            reference: 'pessoa',
            proximoFoco: 'produto',
            buscarPor: 'Genérica',
            associations: [
                ['PESSOAS_NOME', 'PESSOAS_NOME'],
                ['PESSOAS_ID',   'PESSOAS_ID']
            ],
            listeners: {
                focus: 'limparPesquisa'
            }
        },        
        {
            hidden: true,
            fieldLabel: 'IdPessoa',
            itemId: 'idpessoa'
        },
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Produto',
            tabela: 'produtos',
            complement: 'idproduto',
            reference: 'produto',
            proximoFoco: 'inicio',
            buscarPor: 'Genérica',
            associations: [
                ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                ['PRODUTOS_ID',   'PRODUTOS_ID']
            ],
            listeners: {
                focus: 'limparPesquisa'
            }        
        },        
        {
            hidden: true,
            fieldLabel: 'IdProduto',
            itemId: 'idproduto'
        },
        {
            xtype: 'datefield',
            proximoFoco: 'final',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    
    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if(this.getMainView().title.match(/Venda/)) {
                return 'venda-row';
            } else if(this.getMainView().title.match(/Compra/)) {
                return 'compra-row';
            }
        }
    },

    columns: {
        items: [
            {
                flex: false,
                width: 100,
                text: 'Empresa',
                dataIndex: 'MOVIMENTOS_ID_EMPRESAS',
                align: 'right'
            },
            {
                flex: false,
                width: 100,
                text: 'Emissão',
                xtype: 'datecolumn',
                dataIndex: 'MOVIMENTOS_EMISSAO',
                align: 'center'
            },            
            {
                flex: false,
                width: 70,
                text: 'N.º',
                dataIndex: 'MOVIMENTOS_NUMERO',
                align: 'right'
            },
            {
                flex: false,
                width: 55,
                text: 'Série',
                dataIndex: 'MOVIMENTOS_SERIE',
                align: 'center'
            },
            {
                flex: false,
                width: 75,
                text: 'Produto',
                dataIndex: 'MOVIMENTOSITENS_ID_PRODUTOS',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Descrição',
                dataIndex: 'PRODUTOS_NOME'
            },
            {
                flex: false,
                width: 85,
                text: 'Qtde',
                dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
                align: 'right'
            },
            {
                flex: false,
                width: 100,
                text: 'Preço',
                dataIndex: 'MOVIMENTOSITENS_PRECO',
                xtype: 'moneycolumn',
                align: 'right'
            },
            {
                flex: false,
                width: 100,
                text: 'Total',
                dataIndex: 'MOVIMENTOSITENS_TOTAL',
                xtype: 'moneycolumn',
                align: 'right'
            }
         ]
    },

    footPanel: [
        {
            xtype: 'container',
            flex: 1
        },
        {
            xtype: 'label',
            width: 100,
            padding: '5 21 5 15',
            style : 'font-weight:bold;text-align:right;color:red;',
            text: 'Total'
        },
        {
            xtype: 'label',
            width: 100,
            padding: '5 23 5 15',
            style : 'font-weight:bold;text-align:right;color:red;',
            bind: {
                text: '{totalGeral}'
            }
        }
    ]
});
