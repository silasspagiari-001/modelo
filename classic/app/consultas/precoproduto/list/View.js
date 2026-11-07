Ext.define('SamosAdmin.consultas.precoproduto.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'precoproduto',

    requires: [
        'SamosAdmin.consultas.precoproduto.list.ViewController',
        'SamosAdmin.consultas.precoproduto.list.ViewModel'
    ],

    selectFootPanelOnDblClick: true,    

    rightbuttons: [
        'Enviar para Lousa',        
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {

            if (record.get('PROMOCOES') && record.get('PROMOCOES').length > 0) {
                return "promocao";
            } else {
                return "foradelinha";
            }
        }
    },

    constructor: function () {
        const isStiloMoveis = configs.getClientName() == 'stilomoveis';
        Ext.apply(this, {
            checkSelection: isStiloMoveis ? true : false,
            checkSelectionLeft: true, // Checkbox à esquerda
            selecionarPrimeiroAposBuscar: false,
            toolbar: [
                {
                    fieldLabel: 'Conteúdo',
                    emptyText: '[F2] - Ajuda na busca',
                    flex: 1,
                    listeners: {
                        focus: 'limparPesquisa'
                    }
                },
                {
                    fieldLabel: 'Ordem',
                    width: 135,
                    defaultValue:0,
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
                    hidden: (configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor && configs.getClientName() != 'stilomoveis'),
                    store:  (configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor && configs.getClientName() == 'stilomoveis')  ? 
                             configs.getProdutos().status.filter(status => (status[0] == 'T' || status[0] == 'L')) : 
                             configs.getProdutos().status
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
                        dataIndex: 'PRODUTOS_ID',
                        align: 'right',
                        renderer: function(value, meta, record) {
                            if (record.get('STATUS') == 'L' && configs.getClientName() != 'prudenmoveis') {
                                return '(*) ' + value;
                            } else {
                                return value;
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 95,
                        text: configs.getProdutos().labelFabrica,
                        dataIndex: 'FABRICA',
                        align: 'left',
                        hidden: !configs.getProdutos().grid['PRODUTOS_FABRICA']
                    },
                    {
                        flex: 1,
                        text: 'Nome',
                        dataIndex: 'NOME'
                    },
                    {
                        flex: false,
                        width: 120,
                        text: configs.getProdutos().labelFabrica.substring(0, 10),
                        dataIndex: 'FABRICA',
                        align: 'left',
                        hidden: configs.getClientName() != 'prudenmoveis'
                    },
                    {
                        flex: false,
                        width: 150,
                        text: configs.getProdutos().labelMarca,
                        dataIndex: 'MARCA',
                        align: 'center',
                        hidden: !configs.getProdutos().grid['PRODUTOS_MARCA'],
                        renderer: function(value, meta, record) {
                            if (record.get('SALDOS')[0]['SALDOS_DISPONIVEL'] <= 0) {
                                meta.style = configs.getProdutos().coresSaldos ? configs.getProdutos().coresSaldos.zerado : "color: red;";
                                return value;
                            } else if (record.get('SALDOS')[0]['SALDOS_DISPONIVEL'] > 0 && record.get('SALDOS')[0]['SALDOS_DISPONIVEL'] <= 5) {
                                meta.style = configs.getProdutos().coresSaldos ? configs.getProdutos().coresSaldos.baixo : "color: yellow;";
                                return value;
                            } else {
                                meta.style = configs.getProdutos().coresSaldos ? configs.getProdutos().coresSaldos.normal : "color: green;";
                                return value;
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 150,
                        text: configs.getProdutos().labelAplicacao,
                        dataIndex: 'APLICACAO',
                        align: 'center',
                        hidden: !configs.getProdutos().grid['PRODUTOS_APLICACAO'],
                        renderer: function(value, meta, record) {
                            if (record.get('SALDOS')[0]['SALDOS_DISPONIVEL'] <= 0) {
                                meta.style = configs.getProdutos().coresSaldos.zerado;
                                return value;
                            } else if (record.get('SALDOS')[0]['SALDOS_DISPONIVEL'] > 0 && record.get('SALDOS')[0]['SALDOS_DISPONIVEL'] <= 5) {
                                meta.style = configs.getProdutos().coresSaldos.baixo;
                                return value;
                            } else {
                                meta.style = configs.getProdutos().coresSaldos.normal;
                                return value;
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Local',
                        dataIndex: 'LOCAL',
                        align: 'center',
                        hidden: !configs.getProdutos().grid['SALDOS_LOCAL']
                    },
                    {
                        flex: false,
                        width: 110,
                        text: 'Montagem',
                        xtype: 'moneycolumn',
                        align: 'right',
                        dataIndex: 'PRECOMONTAGEM',
                        hidden: (!configs.getProdutos().grid['MONTAGENS_VALOR'] || !configs.getProdutos().montagemProdutos)
                    },
                    {
                        flex: false,
                        width: 60,
                        text: 'Unid',
                        dataIndex: 'UNIDADE',
                        hidden: (!configs.getProdutos().grid['PRODUTOS_UNIDADE']),
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Saldo',
                        dataIndex: 'DISPONIVEL',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 125,
                        text: configs.getProdutos().labelPreco,
                        xtype: 'moneycolumn',
                        align: 'right',
                        dataIndex: 'PRECO',
                        hidden: !configs.getProdutos().grid['SALDOS_PRECO']
                    },
                    {
                        flex: false,
                        width: 110, // 130
                        text: configs.getProdutos().labelPrazo,
                        xtype: 'moneycolumn',
                        align: 'right',
                        dataIndex: 'PRAZO',
                        hidden: !configs.getProdutos().grid['SALDOS_PRAZO']
                    },
                    {
                        flex: false,
                        width: 110, // 130
                        text: (configs.getProdutos().labelMinimo || 'Mínimo'),
                        xtype: 'moneycolumn',
                        align: 'right',
                        dataIndex: 'PRECOMINIMO',
                        hidden: !configs.getProdutos().grid['SALDOS_PRECOMINIMO']
                    },
                    {
                        flex: false,
                        width: 125,
                        text: configs.getProdutos().labelPrazo,
                        xtype: 'moneycolumn',
                        align: 'right',
                        dataIndex: 'PRAZO',
                        hidden: configs.getClientName() != 'stilomoveis'
                    },
                ]
            },
            
            footPanel: [
                {
                    xtype: 'label',
                    width: 50,
                    padding: '0 0 0 50',
                    style : 'font-weight: bold; color: blue;',
                    bind: {
                        hidden: '{!isSupervisor || isPrudenmoveis || isStilomoveis}',
                        text: configs.getProdutos().precoMargemMinimo ? '{gridprecoproduto.selection.PRECOMINIMO}|' : '{gridprecoproduto.selection.CUSTO}|'
                    }
                },
                {
                    xtype: 'label',
                    flex: 2,
                    padding: '0 0 0 15',
                    style : 'font-weight: bold; color: red;',
                    bind: {
                        hidden: '{!isStilomoveis}',
                        text: '{gridprecoproduto.selection.NOME}' + ' ' + '{gridprecoproduto.selection.APLICACAO}'
                    }
                },
                {
                    xtype: 'label',
                    flex: 2,
                    padding: '0 50 0 50',
                    align: 'left',
                    style : 'font-weight: bold; color: black;',
                    bind: {
                        hidden: '{isPrudenmoveis || isStilomoveis}',
                        text: '{gridprecoproduto.selection.APLICACAO}|' + '{gridprecoproduto.selection.CLASSE}'
                    }
                }
            ]
        });
        this.callParent(arguments);
    }
});
