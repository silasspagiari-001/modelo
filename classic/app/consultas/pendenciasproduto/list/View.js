Ext.define('SamosAdmin.consultas.pendenciasproduto.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'pendenciasproduto',

    requires: [
        'SamosAdmin.consultas.pendenciasproduto.list.ViewController',
        'SamosAdmin.consultas.pendenciasproduto.list.ViewModel'
    ],

    modelName: 'SamosAdmin.movimentos.movimento.ModelItens',

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,
    selecionarPrimeiroAposBuscar: false,

    gridListeners: {
        selectionchange: 'onSelectionChange'
    },


    toolbar: [
        {
            flex: 1,
            xtype: 'samoswidgets-textsearch',
            fieldLabel: 'Produto',
            tabela: 'produtos',
            complement: 'idproduto',
            reference: 'produto',
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
            action: 'Buscar',
            ui: 'secondary'
        }
    ],
    
    columns: {
        items: [
            {
                flex: false,
                width: 75,
                text: 'Pessoa',
                dataIndex: 'MOVIMENTOS_ID_PESSOAS',
                align: 'center'
            },
            {
                flex: false,
                width: 85,
                text: 'Qtde',
                dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
                align: 'right'
            },
            {
                flex: 1,
                text: 'Nome da Pessoa',
                dataIndex: 'MOVIMENTOS_NOME'
            },
            {
                flex: false,
                width: 130,
                text: 'Retirado',
                dataIndex: 'MOVIMENTOS_PROTOCOLO'
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
                dataIndex: 'TOTAL_LIQUIDO',
                xtype: 'moneycolumn',
                align: 'right'
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
            style : 'font-weight:bold;text-align:right;color:black;',
            html: 'Selecionado<br>Total'
        },
        {
            xtype: 'label',
            width: 100,
            padding: '5 23 5 15',
            style : 'font-weight:bold;text-align:right;color:blue;',
            bind: {
                  html: '{totalSelecionado}<br>{totalGeral}'
            }
        }
    ]
});
