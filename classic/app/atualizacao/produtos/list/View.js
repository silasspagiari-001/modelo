Ext.define('SamosAdmin.atualizacao.produtos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'produtos',

    requires: [
        'SamosAdmin.atualizacao.produtos.form.View',
        'SamosAdmin.atualizacao.produtos.list.ViewController',
        'SamosAdmin.atualizacao.produtos.list.ViewModel'
    ],

    selectFootPanelOnDblClick: true,

    leftbuttons: [
        'Novo'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {    
            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    flex: 1,
                    emptyText: '[F2] - Ajuda na busca'
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    store: [
                        [0, 'Nome'],
                        [1, 'Contéudo'],
                        [5, 'Aplicação'],
                        [6, 'Fábrica'],
                        [4, 'Marca'],
                        [2, 'Código'],
                        [7, 'Preço']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 135,
                    store: configs.getProdutos().status
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
                        text: 'Código',
                        dataIndex: 'PRODUTOS_ID',
                        align: 'center',
                        renderer: function(value, meta, record) {
                            if (record.get('PRODUTOS_STATUS') == 'L') {
                                return '(*) ' + value;
                            } else {
                                return value;
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 120,
                        hidden: !configs.getProdutos().grid['PRODUTOS_FABRICA'],
                        text: configs.getProdutos().labelFabrica,
                        dataIndex: 'PRODUTOS_FABRICA'
                    },
                    {
                        flex: 3,
                        text: 'Nome',
                        dataIndex: 'PRODUTOS_NOME'
                    },
                    {
                        flex: false,
                        width: 120,
                        text: configs.getProdutos().labelFabrica.substring(0, 10),
                        dataIndex: 'PRODUTOS_FABRICA',
                        align: 'left',
                        hidden: configs.getClientName() != 'prudenmoveis'
                    },
                    {
                        flex: false,
                        width: 150,
                        hidden: !configs.getProdutos().grid['PRODUTOS_MARCA'],
                        text: configs.getProdutos().labelMarca,
                        dataIndex: 'PRODUTOS_MARCA'
                    },
                    {
                        flex: false,
                        width: 150,
                        hidden: !configs.getProdutos().grid['PRODUTOS_APLICACAO'],
                        text: configs.getProdutos().labelAplicacao,
                        dataIndex: 'PRODUTOS_APLICACAO'
                    },
                    {
                        flex: false,
                        width: 50,
                        hidden: !configs.getProdutos().grid['PRODUTOS_UNIDADE'],
                        text: 'Un',
                        dataIndex: 'PRODUTOS_UNIDADE'
                    },
                    {
                        flex: false,
                        width: 100,
                        hidden: !configs.getProdutos().grid['SALDOS_LOCAL'],
                        text: 'Local',
                        dataIndex: 'SALDOS_LOCAL'
                    },
                    {
                        flex: false,
                        width: 110,
                        hidden: (!configs.getProdutos().montagemProdutos || !configs.getProdutos().grid['MONTAGENS_VALOR']),
                        text: 'Montagem',
                        xtype: 'moneycolumn',
                        align: 'right',
                        dataIndex: 'MONTAGENS_VALOR'
                    },
                    {
                        flex: false,
                        width: 75,  // 95
                        text: 'Saldo',
                        align: 'right',
                        hidden: !configs.getProdutos().grid['SALDOS_DISPONIVEL'],
                        dataIndex: (configs.getClientName() == 'racaforte' ? 'LIQUIDO_ESTOQUE' : 'SALDOS_DISPONIVEL')
                    },
                    {
                        flex: false,
                        width: 125,
                        text: configs.getProdutos().labelPreco,
                        xtype: 'moneycolumn',
                        align: 'right',
                        hidden: !configs.getProdutos().grid['SALDOS_PRECO'],
                        dataIndex: 'SALDOS_PRECO'
                    },
                    {
                        flex: false,
                        width: 120,
                        text: configs.getProdutos().labelPrazo,
                        xtype: 'moneycolumn',
                        align: 'right',
                        hidden: !configs.getProdutos().grid['SALDOS_PRAZO'],
                        dataIndex: 'SALDOS_PRAZO'
                    },
                    {
                        flex: false,
                        width: 120,
                        text: configs.getProdutos().labelTransferencia,
                        xtype: 'moneycolumn',
                        align: 'right',
                        hidden: !configs.getProdutos().grid['SALDOS_TRANSFERENCIA'],
                        dataIndex: 'SALDOS_TRANSFERENCIA'
                    },
                    {
                        flex: false,
                        width: 120,
                        text:   (configs.getProdutos().labelMinimo || 'Mínimo'),
                        xtype: 'moneycolumn',
                        align: 'right',
                        hidden: !configs.getProdutos().grid['SALDOS_PRECOMINIMO'],
                        dataIndex: 'SALDOS_PRECOMINIMO'
                    },
                    {
                        flex: false,
                        width: 125,
                        text: configs.getProdutos().labelPrazo,
                        xtype: 'moneycolumn',
                        align: 'right',
                        hidden: configs.getClientName() != 'stilomoveis',
                        dataIndex: 'SALDOS_PRAZO'
                    },
                ]
            },
            footPanel: [
                {
                    xtype: 'label',
                    flex: 4,
                    padding: '0 0 0 15',
                    style : 'text-align:left;font-weight: bold; color: red;',
                    bind: {
                        text: '{nomeProduto}'
                    }
                }
            ]            

        });
        this.callParent(arguments);        
    }            
});
