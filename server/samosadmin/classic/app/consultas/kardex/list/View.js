Ext.define('SamosAdmin.consultas.kardex.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'kardex',

    requires: [
        'SamosAdmin.consultas.kardex.list.ViewController',
        'SamosAdmin.consultas.kardex.list.ViewModel'
    ],

    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,

    constructor: function(){
        Ext.apply(this, {
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
                        ['PRODUTOS_NOME',       'PRODUTOS_NOME'],
                        ['PRODUTOS_ID',         'PRODUTOS_ID']
                    ],
                    listeners: {
                        focus: 'limparPesquisa'
                    }
                },        
                {
                    hidden: false,
                    bind: {
                        readOnly: true
                    },
                    width: 75,
                    fieldLabel: 'Código', //'IdProduto', //
                    fieldStyle: 'text-align:right;',
                    itemId: 'idproduto'
                },
                {
                    hidden: configs.getClientName() != 'racaforte',
                    bind: {
                        readOnly: true
                    },
                    width: 100,
                    fieldLabel: 'Saldo',
                    fieldStyle: 'text-align:right;',
                    itemId: 'sldproduto'
                },
                {
                    hidden: configs.getClientName() != 'racaforte',
                    bind: {
                        readOnly: true
                    },
                    width: 100,
                    fieldLabel: 'Orçamento',
                    fieldStyle: 'text-align:right;',                    
                    itemId: 'orcproduto'
                },
                {
                    hidden: configs.getClientName() != 'racaforte',
                    bind: {
                        readOnly: true
                    },
                    width: 100,
                    fieldLabel: 'Pendência',
                    fieldStyle: 'text-align:right;',                    
                    itemId: 'penproduto'
                },
                {
                    hidden: false,
                    width: 100,
                    fieldLabel: 'Disponível',
                    fieldStyle: 'text-align:right;',                    
                    itemId: 'sldfinproduto',
                    bind: {
                        readOnly: true
                    }
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
                    if(record.get('OPERACOES_ESTOQUE') == 'N') {
                        return 'nulo-row';
                    } else if(record.get('MOVIMENTOSITENS_SALDO') < 0) {
                        return 'negativo-row';
                    } else if(record.get('MOVIMENTOSITENS_SALDO') == 0) {
                        return 'zero-row';
                    } else if(record.get('OPERACOES_ESTOQUE') == 'C') {
                        return 'entrada-row';
                    } else if(record.get('OPERACOES_ESTOQUE') == 'D') {
                        return 'saida-row';
                    }
                }
            },

            columns: {
                items: [
                    {
                        flex: false,
                        width: 60,
                        text: 'Filial',
                        sortable: false,
                        dataIndex: 'MOVIMENTOS_ID_EMPRESAS',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Data',
                        sortable: false,
                        xtype: 'datecolumn',
                        dataIndex: 'MOVIMENTOS_KARDEX',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 70,
                        text: 'N.º',
                        sortable: false,
                        dataIndex: 'MOVIMENTOS_NUMERO',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 55,
                        text: 'Série',
                        sortable: false,
                        dataIndex: 'MOVIMENTOS_SERIE',
                        align: 'center'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'CFOP',
                        sortable: false,
                        dataIndex: 'MOVIMENTOSITENS_ID_OPERACOES',
                        align: 'center',
                        renderer:  function(value) {
                            const array = value.toString().split('');
                            array.splice(4, 0, '-');
                            array.splice(1, 0, '.');
                        return array.join('');
                        }
                    },
                    {
                        flex: 1,
                        text: 'Descrição',
                        sortable: false,
                        dataIndex: 'OPERACOES_NOME'
                    },
                    {
                        flex: false,
                        width: 90,
                        text: 'Estoque',
                        sortable: false,
                        dataIndex: 'OPERACOES_ESTOQUE',
                        renderer:  function(value) {
                            if(value == 'D') {
                                return 'Saída';
                            } else if(value == 'C') {
                                return 'Entrada';
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 85,
                        text: 'Qtde',
                        sortable: false,
                        dataIndex: 'MOVIMENTOSITENS_QUANTIDADE',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 80,
                        text: 'Saldo',
                        sortable: false,
                        dataIndex: 'MOVIMENTOSITENS_SALDO',
                        align: 'right',
                        renderer: function(value, meta, record) {
                            if(value < 0) {
                                meta.style = "color:red;";
                            }
                            return value;
                        }
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Preço',
                        sortable: false,
                        dataIndex: 'MOVIMENTOSITENS_PRECO',
                        xtype: 'moneycolumn',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 100,
                        text: 'Total',
                        sortable: false,
                        dataIndex: 'MOVIMENTOSITENS_TOTAL',
                        xtype: 'moneycolumn',
                        align: 'right'
                    }
                ]
            },

            footPanel: [
                {
                    xtype: 'label',
                    width: 63,
                    padding: '5 0 5 15',
                    style : 'font-weight: bold; color: black;',
                    bind: {
                        text: 'Nome:'
                    }
                },
                {
                    xtype: 'label',
                    flex: 1.8,
                    padding: '5 0 5 15',
                    style : 'font-weight: bold; color: black;',
                    bind: {
                        text: '{gridkardex.selection.PESSOAS_NOME} ({gridkardex.selection.PESSOAS_FANTASIA})'
                    }
                },
                {
                    xtype: 'container',
                    flex: 1
                }
            ]
        });

        this.callParent(arguments);            
    }
});
