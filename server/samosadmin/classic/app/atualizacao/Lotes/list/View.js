Ext.define('SamosAdmin.atualizacao.lotes.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'lotes',

    requires: [
        'SamosAdmin.atualizacao.lotes.form.View',
        'SamosAdmin.atualizacao.lotes.list.ViewController',
        'SamosAdmin.atualizacao.lotes.list.ViewModel'
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
            flex: 3,
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
            readOnly: true,
            width: 70,
            fieldLabel: 'IdProduto',
            itemId: 'idproduto'
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Inicio',
            width: 130
        },
        {
            xtype: 'datefield',
            fieldLabel: 'Final',
            width: 130
        },
        {
            fieldLabel: 'Ordem',
            width: 135,
            store: [
                [0, 'Descrição'],
                [1, 'Contéudo'],
                [2, 'Lote'],
                [3, 'Fabricação'],
                [4, 'Validade'],
                [5, 'Produto']
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
                width: 90,
                text: 'Código',
                dataIndex: 'LOTES_ID',
                align: 'right'
            },
            {
                flex: false,
                width: 110,
                text: 'Lote',
                dataIndex: 'LOTES_REFERENCIA',
                align: 'center'
            },
            {
                flex: 1,
                text: 'Produto',
                dataIndex: 'PRODUTOS_NOME',
                align: 'left'
            },
            {
                flex: false,
                width: 100,
                text: 'Fabricação',
                xtype: 'datecolumn',
                dataIndex: 'LOTES_FABRICACAO',
                align: 'center'
            },
            {
                flex: false,
                width: 100,
                text: 'Validade',
                xtype: 'datecolumn',
                dataIndex: 'LOTES_VALIDADE',
                align: 'center'
            },
            {
                flex: false,
                width: 120,
                text: 'Saldo',
                xtype: 'moneycolumn',
                dataIndex: 'SALDO_LOTES',
                align: 'right',
                renderer: function(value, meta, record) {
                    meta.style = "color: blue;";
                    return Ext.util.Format.maskRenderer('#9.990,00', true, true)(value);
                }
            }
        ]
    }
});
