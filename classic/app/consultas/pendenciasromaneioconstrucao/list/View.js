Ext.define('SamosAdmin.consultas.pendenciasromaneioconstrucao.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'pendenciasromaneioconstrucao',

    requires: [
        'SamosAdmin.consultas.pendenciasromaneioconstrucao.list.ViewController',
        'SamosAdmin.consultas.pendenciasromaneioconstrucao.list.ViewModel'
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
                width: 70,
                text: 'Prod',
                dataIndex: 'MOVIMENTOSITENS_ID_PRODUTOS',
                align: 'right'
            },
            {
                flex: 1,
                text: 'Descrição',
                dataIndex: 'PRODUTOS_NOME'
            },
            {
                flex: false,
                width: 110,
                text: 'Pedido',
                dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
                align: 'right'
            },
            {
                flex: false,
                width: 110,
                text: 'Loja/Dep',
                dataIndex: 'MOVIMENTOSITENS_ENTREGUE',
                align: 'right'
            },
            {
                flex: false,
                width: 110,
                text: 'Romaneio',
                dataIndex: 'ENTREGUE_ROMANEIO',
                align: 'right'
            }
         ]
    }

});
