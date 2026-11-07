Ext.define('SamosAdmin.atualizacao.produtos.multisearch.View', {
    extend: 'SamosWidgets.multisearch.View',
    xtype: 'produtosmultisearch',

    requires: [
        'SamosAdmin.atualizacao.produtos.multisearch.ViewModel',
        'SamosAdmin.atualizacao.produtos.multisearch.ViewController'
    ],

    hidePaging: true,

    rightbuttons: [
        'Importar',
        'Sair'
    ],

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            if (record.get('VALOR_PROMOCAO') > 0) {
                return "promocao";
            }
        }
    },

    constructor: function () {

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
                        [4, 'Marca'],
                        [2, 'Código'],
                        [3, 'Genérica'],
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
                    flex: 1,
                    text: 'Nome',
                    dataIndex: 'PRODUTOS_NOME'
                },
                {
                    flex: false,
                    width: 100,
                    text: configs.getProdutos().labelMarca,
                    hidden: !configs.getProdutos().grid['PRODUTOS_MARCA'],
                    dataIndex: 'PRODUTOS_MARCA',
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
                    width: 100,
                    text: configs.getProdutos().labelAplicacao,
                    hidden: !configs.getProdutos().grid['PRODUTOS_APLICACAO'],
                    dataIndex: 'PRODUTOS_APLICACAO',
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
                    hidden: !configs.getProdutos().grid['SALDOS_DISPONIVEL'],
                    dataIndex: 'SALDOS_DISPONIVEL'
                },
                {
                    flex: false,
                    width: 95,
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
                    width: 105,
                    text: configs.getProdutos().labelTransferencia,
                    xtype: 'moneycolumn',
                    align: 'right',
                    hidden: !configs.getProdutos().grid['SALDOS_TRANSFERENCIA'],
                    dataIndex: 'SALDOS_TRANSFERENCIA'
                },
                {
                    xtype: 'actioncolumn',
                    width: 30,
                    items: [{
                        iconCls: 'x-fa fa-search',
                        handler: function(grid, rowIndex, colIndex) {
                            const record = grid.getStore().getAt(rowIndex);
                            const produto = Ext.create('SamosAdmin.atualizacao.produtos.Model', Object.assign({}, record.data));
                            const janelaSaldos = Ext.create({
                                xtype: 'formprecossaldos' // formprecos ??
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
                        text: '{gridprodutosmultisearch.selection.SALDOS_CUSTO}|' 
                    }
                },        
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '0 50 0 50',
                    style : 'font-weight: bold;color:blue;',
                    bind: {
                        text: '{gridprodutosmultisearch.selection.PRODUTOS_APLICACAO} | '+
                              '{gridprodutosmultisearch.selection.PRODUTOS_NOME}'
                    }
                }
            ]           
        });

        this.callParent(arguments);        
    }
});
