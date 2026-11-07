Ext.define('SamosAdmin.consultas.precoproduto.formlotes.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formprecoslotes',
    collapsible: false,

    requires: [
        'SamosAdmin.consultas.precoproduto.formlotes.ViewModel',
        'SamosAdmin.consultas.precoproduto.formlotes.ViewController'
    ],

    rightbuttons: [
        'Sair'
    ],

    title: 'Lotes e Saldos',
    hidePaging: true,

    viewConfig: {
        getRowClass: function(record, rowIndex, store) {
            this.focus();
            const disponivel = record.get('LOTES_SALDO');

            if (disponivel == 0) {
                return "zerado";
            } else if (disponivel > 0) {
                return "estoque";
            } else if (disponivel < 0) {
                return "negativo";
            }
        }
    },

    constructor: function() {
        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Saldos',
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-griditems', 
                                    reference: 'saldos',
                                    qtdeLinhasMinima: 0,                            
                                    mostrarNumeroLinhas: false,
                                    permitidoGridVazia: true,
                                    name: 'SALDOS',
                                    idProperty: 'SALDOS_ID', 
                                    descartarSeVazio: 'SALDOS_ID',
                                    flex: 1,
                                    bind: {
                                        store: '{saldos}'
                                    },
                                    fields: [
                                        {
                                            title: 'Loja',
                                            name: 'EMPRESAS_ID', 
                                            xtype: 'textfield',
                                            width : 90,
                                            flex: false,
                                            fieldStyle: {
                                                textAlign: 'center'
                                            },        
                                            readOnly: true
                                        },
                                        {
                                            title: 'Fantasia',
                                            name: 'EMPRESAS_FANTASIA', 
                                            xtype: 'textfield',
                                            flex: 2,
                                            readOnly: true
                                        },
                                        {
                                            title: 'Saldo',
                                            name: 'SALDOS_DISPONIVEL', 
                                            xtype: 'numberfield',
                                            width : 130,
                                            flex: false,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },        
                                            readOnly: true
                                        },
                                        {
                                            title: 'Pendência',
                                            name: 'SALDOS_RESERVADO', 
                                            xtype: 'numberfield',
                                            hidden: !configs.getUsuario().privilegiado,
                                            width : 130,
                                            flex: false,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },        
                                            readOnly: true
                                        },
                                        {
                                            title: 'Comprado',
                                            name: 'SALDOS_COMPRADO', 
                                            xtype: 'numberfield',                                           
                                            hidden: !configs.getUsuario().privilegiado,
                                            width : 130,
                                            flex: false,
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },        
                                            readOnly: true
                                        }                                                                                
                                    ]                                    
                                }        
                            ]
                        }
                    ]
                }
            ],
            columns: [
                    {
                        text: 'Lote',
                        dataIndex: 'LOTES_REFERENCIA',
                        flex : false,
                        width: 120
                    },
                    {
                        text: 'Fabricação',
                        xtype: 'datecolumn',                        
                        dataIndex: 'LOTES_FABRICACAO',
                        flex: false,
                        width: 100,
                        align: 'center'
                    },
                    {
                        text: 'Validade',
                        xtype: 'datecolumn',                        
                        dataIndex: 'LOTES_VALIDADE',
                        flex : false,
                        width: 100,
                        align: 'center'
                    },
                    {
                        text: 'Saldo',
                        dataIndex: 'LOTES_SALDO', 
                        flex : false,
                        width: 100,
                        align: 'right'
                    },
                    {
                        text: 'Produto',
                        dataIndex: 'PRODUTOS_NOME',
                        flex : 1
                    }
                ],

                footPanel: [
                    {
                        xtype: 'label',
                        flex: 1,
                        padding: '10 0 10 15',
                        style: 'font-weight: bold;color: blue;',
                        bind: {
                            text: '{promocoes.nome}'
                        }
                    },
                    {
                        xtype: 'label',
                        width: 80,
                        padding: '10 0 10 15',
                        style : 'font-weight: bold;color: blue;',
                        bind: {
                            text: '{promocoes.termino}'
                        }
                    },
                    {
                        xtype: 'label',
                        width: 80,
                        padding: '10 0 10 15',
                        style : 'text-align:right;font-weight: bold;color: blue;',
                        bind: {
                            text: '{promocoes.desconto}'
                        }
                    },
                    {
                        xtype: 'label',
                        width: 80,
                        padding: '10 0 10 15',
                        style : 'text-align:right;font-weight: bold;color: blue;',
                        bind: {
                            text: '{promocoes.partida}'
                        }
                    },
                    {
                        xtype: 'label',
                        width: 80,
                        padding: '10 0 10 15',
                        style : 'text-align:right;font-weight: bold;color: blue;',
                        bind: {
                            text: '{promocoes.parcelas}'
                        }
                    },
                    {
                        xtype: 'label',
                        width: 100,
                        padding: '10 30 10 15',
                        style : 'text-align:right;font-weight: bold;color: blue;',
                        bind: {
                            text: '{promocoes.valorParcela}'
                        }
                    }
                ]
        });

        this.callParent(arguments);
    }            
});
