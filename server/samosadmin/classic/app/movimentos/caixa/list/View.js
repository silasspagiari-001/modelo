Ext.define('SamosAdmin.movimentos.caixa.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'caixa',

    requires: [
        'SamosAdmin.movimentos.caixa.form.View',
        'SamosAdmin.movimentos.caixa.list.ViewController',
        'SamosAdmin.movimentos.caixa.list.ViewModel'
    ],

    leftbuttons: [
        'Abrir',
        'Novo',
        'Sangria',
        'Fechar',
        'Imprimir'
    ],
    
    rightbuttons: [
        'Sair'
    ],

    hidePaging: true,

    constructor: function() {
        Ext.apply(this, {
            toolbar: [
                {
                    fieldLabel: 'Caixa',
                    width: 80,
                    store: (configs.getFinanceiros().caixas || []),
                    hidden: (configs.getFinanceiros().caixas || []).length == 0
                },
                {
                    xtype: 'datefield',
                    fieldLabel: 'Emissão',
                    width: 130
                },
                {
                    action: 'Buscar',
                    ui: 'secondary'
                }
            ],
            viewConfig: {
                getRowClass: function(record, rowIndex, store) {
                    const status      = record.get('MOVIMENTOSCAIXA_STATUS');
                    const exportado   = record.get('MOVIMENTOSCAIXA_EXPORTADO');
                    const saldo       = record.get('MOVIMENTOSCAIXA_SALDO');
        
                    if (exportado == 'Z') {
                        return "sangria";
                    } else {
                        if (saldo >= 0) {
                            if (status == 'A') {
                                return "aberto";
                            } else if (status == 'F') {
                                return "fechado";
                            }
                        } else {
                            return "negativo";
                        }
                    }
                }
            },
            columns: {
                items: [
                    {
                        flex: false,
                        width: 90,
                        text: 'Hora',
                        dataIndex: 'MOVIMENTOSCAIXA_HORA', 
                        align: 'center'
                    },            
                    {
                        flex: 1,
                        text: 'Descrição',
                        dataIndex: 'MOVIMENTOSCAIXA_NOME',
                        align: 'left'
                    },
                    {
                        flex: false,
                        width: 75,
                        text: 'Tipo',
                        dataIndex: 'MOVIMENTOSCAIXA_TIPO',
                        renderer:  function(value) {
                            if(value == 'E') {
                                return 'Entrada';
                            } else if(value == 'S') {
                                return 'Saída';
                            } else if(value == 'N') {
                                return 'Nulo';
                            }
                        }
                    },
                    {
                        flex: false,
                        width: 100,
                        text:  configs.getFinanceiros().labelDinheiro || 'Dinheiro',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_DINHEIRO',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 90,
                        text: configs.getFinanceiros().labelCheque || 'Cheque',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_CHEQUE',
                        align: 'right',
                        hidden: configs.getClientName() == 'prudenmoveis'                        
                    },
                    {
                        flex: false,
                        width: 135,
                        text: configs.getFinanceiros().labelCredito || 'Cartão Crédito',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_CREDITO',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 130,
                        text: configs.getFinanceiros().labelDebito || 'Cartão Débito',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_DEBITO',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 110,
                        text: configs.getFinanceiros().labelDuplicata || 'Duplicata', // Carnê em móveis
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_DUPLICATA',
                        align: 'right',
                        hidden: !configs.getFinanceiros().exibirDuplicataNoCaixa
                    },   
                    {
                        flex: false,
                        width: 110,
                        text: configs.getFinanceiros().labelTransferencia || 'Transf/Pix',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_TRANSFERENCIAS',
                        align: 'right'
                    },
                    {
                        flex: false,
                        width: 110,
                        text: configs.getFinanceiros().labelOutro,
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_OUTRO',
                        align: 'right',
                        hidden: configs.getClientName() != 'prudenmoveis'
                    },    
                    {
                        flex: false,
                        width: 110,
                        text: 'Saldo',
                        xtype: 'moneycolumn',
                        dataIndex: 'MOVIMENTOSCAIXA_SALDO',
                        align: 'right',
                    },
                    
                ]
            },
            footPanel: [
                {
                    xtype: 'label',
                    flex: 1,
                    padding: '5 11 5 5',
                    style : 'font-weight: bold; color: black;',
                    bind: {
                        text: '{gridcaixa.selection.MOVIMENTOSCAIXA_NOME}'
                    }
                },
                {   // Dinheiro
                    xtype: 'displayfield',
                    labelStyle: 'font-size:12px;width:100;text-align:right;font-weight:bold;color:green !important',
                    fieldLabel: 'Dinheiro',
                    labelAlign: 'top',            
                    width: 85,
                    padding: '5 13 5 5',
                    style : 'font-weight:bold;text-align:right;color:blue;',
                    fieldStyle: {
                        color: 'green !important',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'right',
                    },
                    bind: {
                        value: '{totalDinheiro}'
                    }
                },
                {   // Cheque
                    xtype: 'displayfield',
                    labelStyle: 'font-size:12px;width:100;text-align:right;font-weight:bold;color:green !important',
                    fieldLabel: 'Cheque',
                    labelAlign: 'top',            
                    width: 80,
                    padding: '5 13 5 5',
                    style : 'font-weight:bold;text-align:right;color:blue;',
                    fieldStyle: {
                        color: 'green !important',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'right',
                    },
                    bind: {
                        value: '{totalCheque}'
                    }
                },
                {   // Cartão Crédito
                    xtype: 'displayfield',
                    labelStyle: 'font-size:12px;width:100;text-align:right;font-weight:bold;color:green !important',
                    fieldLabel: 'Cartão Crédito',
                    labelAlign: 'top',            
                    width: 110,
                    padding: '5 13 5 5',
                    style : 'font-weight:bold;text-align:right;color:blue;',
                    fieldStyle: {
                        color: 'green !important',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'right',
                    },
                    bind: {
                        value: '{totalCredito}'
                    }
                },
                {   // Cartão Débito
                    xtype: 'displayfield',
                    labelStyle: 'font-size:12px;width:100;text-align:right;font-weight:bold;color:green !important',
                    fieldLabel: 'Cartão Débito',
                    labelAlign: 'top',            
                    width: 110,
                    padding: '5 13 5 5',
                    style : 'font-weight:bold;text-align:right;color:blue;',
                    fieldStyle: {
                        color: 'green !important',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'right',
                    },
                    bind: {
                        value: '{totalDebito}'
                    }
                },
                {
                    xtype: 'displayfield',
                    labelStyle: 'font-size:12px;width:100;text-align:right;font-weight:bold;color:green !important',
                    fieldLabel: 'Duplicata',
                    labelAlign: 'top',            
                    width: 100,
                    padding: '5 13 5 5',
                    style : 'font-weight:bold;text-align:right;color:blue;',
                    hidden: configs.getFinanceiros().exibirDuplicataNoCaixa === false,
                    fieldStyle: {
                        color: 'green !important',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'right',
                    },
                    bind: {
                        value: '{totalDuplicata}'
                    }
                },
                {
                    xtype: 'displayfield',
                    labelStyle: 'font-size:12px;width:100;text-align:right;font-weight:bold;color:blue !important',
                    fieldLabel: 'Total',
                    labelAlign: 'top',            
                    width: 105,
                    padding: '5 13 5 5',
                    style : 'font-weight:bold;text-align:right;color:blue;',
                    fieldStyle: {
                        color: 'blue !important',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        textAlign: 'right',
                    },
                    bind: {
                        value: '{saldoGeral}'
                    }
                }
            ]
        });

        this.callParent(arguments);
    }
});
