Ext.define('SamosAdmin.atualizacao.produtos.search.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'produtossearch',

    requires: [
        'SamosAdmin.atualizacao.produtos.search.ViewModel',
        'SamosAdmin.atualizacao.produtos.search.ViewController'
    ],

    title: 'Produtos',
    width: 960,  // 900

    rightbuttons: [
        'Selecionar',
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('VALOR_PROMOCAO') > 0) {
                return "promocao";
            }
            if (record.get('PRODUTOS_DERIVADO') == 'V' && configs.getClientName() == 'racaforte') {   // Vacinas Raçaforte
                return "promocao";
            }
        }
    },

    constructor: function () {
        let isMovimento = Ext.$('formmovimentos')[0] ? true : false;
        let isTransferencia = (isMovimento ? (Ext.$('formmovimentos')[0].getViewModel().get('isTransferencia') ? true : false) : false);
        let hideSaldo = (((isMovimento && isTransferencia) && config.getClientName() != 'bellar') || !configs.getProdutos().grid['SALDOS_DISPONIVEL']);

        Ext.apply(this, {
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
                        [5, 'Aplicação'],                        
                        [4, 'Marca'],
                        [2, 'Código'],
                        [3, 'Genérica'],
                        [7, 'Preço']
                    ]
                },
                {
                    fieldLabel: 'Status',
                    width: 165,
                    store: configs.getProdutos().status
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],
        
            columns: [
                {
                    width: 80,
                    text: 'Código',
                    dataIndex: 'PRODUTOS_ID',
                    align: 'center',
                    renderer: function(value, meta, record) {
                        if (record.get('PRODUTOS_STATUS') == 'L' && configs.getClientName() != 'prudenmoveis') {
                            return '(*) ' + value;
                        } else {
                            return value;
                        }
                    }
                },
                {
                    flex: false,
                    width: 95,
                    text: 'Fábrica',
                    align: 'left',
                    hidden: !configs.getProdutos().grid['PRODUTOS_FABRICA'],
                    dataIndex: 'PRODUTOS_FABRICA'
                },
                {
                    flex: 1,
                    text: 'Nome',
                    dataIndex: 'PRODUTOS_NOME'
                },
                {
                    flex: false,
                    width: 130,
                    text: configs.getProdutos().labelFabrica.substring(0, 10),
                    dataIndex: 'PRODUTOS_FABRICA',
                    align: 'left',
                    hidden: configs.getClientName() != 'prudenmoveis'
                },
                {
                    flex: false,
                    width: (configs.getProdutos().grid['SALDOS_PRAZO'] ? 100 : 150),
                    text: configs.getProdutos().labelMarca,
                    hidden: !configs.getProdutos().grid['PRODUTOS_MARCA'],
                    dataIndex: 'PRODUTOS_MARCA',
                    align: 'center',
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
                    width: 110,
                    text: 'Montagem',
                    xtype: 'moneycolumn',
                    align: 'right',
                    dataIndex: 'PRECO_MONTAGEM',
                    hidden: (!configs.getProdutos().grid['MONTAGENS_VALOR'] || !configs.getProdutos().montagemProdutos)
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
                    width: 100,
                    hidden: !configs.getProdutos().grid['NCMS_NCM'],
                    text: 'Ncm',
                    dataIndex: 'NCMS_NCM'
                },
                {
                    flex: false,
                    width: ((configs.getProdutos().grid['SALDOS_PRAZO'] ||configs.getProdutos().grid['SALDOS_TRANSFERENCIA']) ? 100 : 150),
                    text: configs.getProdutos().labelAplicacao,
                    hidden: !configs.getProdutos().grid['PRODUTOS_APLICACAO'],
                    dataIndex: 'PRODUTOS_APLICACAO',
                    align: 'center',
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
                    width: 80,
                    text: 'Saldo',
                    align: 'right',
                    hidden: hideSaldo,
                    dataIndex: 'SALDOS_DISPONIVEL'
                },
                {
                    flex: false,
                    width: 105,
                    text: configs.getProdutos().labelPreco,
                    xtype: 'moneycolumn',
                    align: 'right',
                    hidden: !configs.getProdutos().grid['SALDOS_PRECO'],
                    dataIndex: 'SALDOS_PRECO'
                },
                {
                    flex: false,
                    width: 105,
                    text: configs.getProdutos().labelPrazo,
                    xtype: 'moneycolumn',
                    align: 'right',
                    hidden: !configs.getProdutos().grid['SALDOS_PRAZO'],
                    dataIndex: 'SALDOS_PRAZO'
                },
                {
                    flex: false,
                    width: 125,
                    text: configs.getProdutos().labelTransferencia,
                    xtype: 'moneycolumn',
                    align: 'right',
                    hidden: !configs.getProdutos().grid['SALDOS_TRANSFERENCIA'],
                    dataIndex: 'SALDOS_TRANSFERENCIA'
                },
                {
                    xtype: 'actioncolumn',
                    hidden: hideSaldo,
                    width: 30,
                    items: [{
                        iconCls: 'x-fa fa-search',
                        handler: function(grid, rowIndex, colIndex) {
                            const record = grid.getStore().getAt(rowIndex);
                            const produto = Ext.create('SamosAdmin.atualizacao.produtos.Model', Object.assign({}, record.data));
                            const janelaSaldos = Ext.create({
                                xtype: 'formprecossaldos'
                            });

                            if(
                                !configs.getUsuario().privilegiado &&
                                configs.getProdutos().exibirSaldoApenasLocalEDeposito
                            ) {//so ve da propria empresa e do deposito, com saldo maximo 10
                                produto.data['SALDOS'] = (produto.data['SALDOS'] || []).filter(saldo => {
                                    if(
                                        (saldo['EMPRESAS_ID'] == configs.getEmpresa().id) || 
                                        (saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i)
                                    ) {
                                        if((saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i)){
                                            saldo['SALDOS_DISPONIVEL'] = saldo['SALDOS_DISPONIVEL'] > 10 ? 10 : saldo['SALDOS_DISPONIVEL'];
                                        }
                                        return true;
                                    } else {
                                        return false;
                                    };
                                });
                            }
                    
                            janelaSaldos.getViewModel().set({
                                model: produto
                            });
                        }
                    }]
                }
            ],

            footPanel: [
                {
                    xtype: 'label',
                    width: 50,
                    padding: '0 0 0 50',
                    style : 'font-weight: bold; color: blue;',
                    bind: {
                        hidden: '{!isSupervisor}',
                        text: '{gridprodutossearch.selection.SALDOS_CUSTO}|' 
                    }
                },        
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 50 0 50',
                    style : 'font-weight: bold;color:blue;',
                    bind: {
                        text: '{gridprodutossearch.selection.PRODUTOS_APLICACAO} | '+
                              '{gridprodutossearch.selection.PRODUTOS_NOME}'
                    }
                }
            ]
        });
        
        this.callParent(arguments);        
    }
});
