Ext.define('SamosAdmin.consultas.comprasvendaspessoa.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'comprasvendaspessoasearch',

    requires: [
        'SamosAdmin.consultas.comprasvendaspessoa.search.ViewModel',
        'SamosAdmin.consultas.comprasvendaspessoa.search.ViewController'
    ],

    title: 'Vendas por Pessoa',

    hidePaging: true,

    rightbuttons: [
        //'Selecionar',
        'Sair'
    ],

    toolbar: [
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

    columns: [
       {
            width: 95,
            text: 'Emissão',
            xtype: 'datecolumn',
            dataIndex: 'MOVIMENTOS_EMISSAO',
            align: 'center'
        },            
        {
            width: 70,
            text: 'N.º',
            dataIndex: 'MOVIMENTOS_NUMERO',
            align: 'right'
        },
        {
            width: 55,
            text: 'Série',
            dataIndex: 'MOVIMENTOS_SERIE',
            align: 'center'
        },
        {
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
            width: 80,
            text: 'Qtde',
            dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
            align: 'right'
        },
        {
            width: 100,
            text: 'Preço',
            dataIndex: 'MOVIMENTOSITENS_PRECO',
            xtype: 'moneycolumn',
            align: 'right'
        },
        {
            width: 100,
            text: 'Total',
            dataIndex: 'MOVIMENTOSITENS_TOTAL',
            xtype: 'moneycolumn',
            align: 'right'
        }
    ],

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
