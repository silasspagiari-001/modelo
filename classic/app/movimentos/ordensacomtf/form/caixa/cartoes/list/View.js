Ext.define('SamosAdmin.movimentos.ordensacomtf.form.caixa.cartoes.list.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formordensacomtfcaixacartoes',

    requires: [
        'SamosAdmin.movimentos.ordensacomtf.form.caixa.cartoes.list.ViewModel',
        'SamosAdmin.movimentos.ordensacomtf.form.caixa.cartoes.list.ViewController'
    ],

    title: 'Cartões',
    modelName: 'SamosFinanceiros.cartoes.Model',
    hidePaging: true,

    listeners: {
        afterrender: 'loadCartoes'
    },

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Sair'
    ],

    constructor: function(){
        Ext.apply(this, {
            formgroups: [
                {
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'grideditable',
                            height: 407,
                            hideNumberer: true,
                            addAfterSave: false,
                            reference: 'cartoes',
                            bind: {
                                store: '{main}'
                            },
                            listeners: {
                                afteraddclick: 'setCartaoDefaults',
                                aftersaveitem: 'checkParcelas'
                            },
                            columns: {
                                items: [
                                    {
                                        text: 'Operadora',
                                        dataIndex: 'CARTOES_ID_OPERADORAS',
                                        width : 110,
                                        flex: false,
                                        align: 'right',
                                        editor: {
                                            xtype: 'samoswidgets-textsearch',
                                            tabela: 'operadoras',
                                            flex: false,
                                            reference: 'operadorasId',
                                            proximoFoco: 'convenio',
                                            callbackFn: 'setTaxaParcelas',
                                            buscarPor: 'Código',
                                            permitirApenasNumeros: true,
                                            associations:[
                                                ['CARTOES_ID_OPERADORAS', 'OPERADORAS_ID'],
                                                ['CARTOES_TIPO',          'OPERADORAS_TIPO'],
                                                ['OPERADORAS_NOME',       'OPERADORAS_NOME'],
                                                ['OPERADORAS_AVISTA',     'OPERADORAS_AVISTA'],
                                                ['OPERADORAS_PARCELADO',  'OPERADORAS_PARCELADO']
                                            ],
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    },
                                    {
                                        text: 'Nome',
                                        dataIndex: 'OPERADORAS_NOME',
                                        flex: 1,
                                        editor: {
                                            xtype: 'textfield',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            flex: false
                                        }
                                    },
                                    {
                                        text: 'Tipo',
                                        dataIndex: 'CARTOES_TIPO',
                                        width : 80,
                                        renderer: function(value, meta, record) {
                                            return value == 'D' ? 'Débito' : 'Crédito';
                                        },
                                        editor: {
                                            flex: false,
                                            xtype: 'combobox',
                                            reference: 'tipo',
                                            proximoFoco: 'convenio',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            store: [
                                                ['D', 'Débito'],
                                                ['C', 'Crédito']
                                            ],
                                            bind: {
                                                readOnly: true
                                            },
                                            listeners: {
                                                change: 'checkParcelas'
                                            }

                                        }
                                    },
                                    {
                                        text: 'Convênio',
                                        dataIndex: 'CARTOES_CONVENIO',
                                        width : 110,
                                        editor: {
                                            flex: false,
                                            xtype: 'combobox',
                                            reference: 'convenio',
                                            proximoFoco: 'autorizacao',
                                            editable: false,
                                            forceSelection: true,
                                            store: configs.getMaquinasCartao(),
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    },
                                    {
                                        text: 'Autorização',
                                        dataIndex: 'CARTOES_AUTORIZACAO',
                                        align: 'right',
                                        width : 120,
                                        editor: {
                                            xtype: 'textfield',
                                            reference: 'autorizacao',
                                            proximoFoco: 'parcelas',
                                            fieldStyle: 'text-align: right;',
                                            enableKeyEvents: true,
                                            maxLength: 10,
                                            flex: false,
                                            width: 120,
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    },
                                    {
                                        text: 'Par',
                                        dataIndex: 'CARTOES_PARCELAS',
                                        align: 'center',
                                        width : 50,
                                        editor: {
                                            xtype: 'numberfield',
                                            flex: false,
                                            width: 50,
                                            reference: 'parcelas',
                                            proximoFoco: 'valor',
                                            decimalPrecision: 0,
                                            hideTrigger: true,
                                            minValue: 1,
                                            maxLength: 2,
                                            fieldStyle: 'text-align: center;',
                                            enableKeyEvents: true,
                                            bind: {
                                                readOnly: '{readOnly}'
                                            },
                                            listeners: {
                                                change: 'setTaxaParcelas'
                                            }
                                        }
                                    },
                                    {
                                        flex: false,
                                        width : 100,
                                        xtype: 'moneycolumn',
                                        text: 'Valor',
                                        dataIndex: 'CARTOES_VALOR',
                                        editor: {
                                            xtype: 'samoswidgets-textmoney',
                                            flex: false,
                                            width: 100,
                                            reference: 'valor',
                                            bind: {
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    },
                                    {
                                        text: 'Obs',
                                        xtype:'actioncolumn',
                                        align: 'center',
                                        width: 50,
                                        items: [
                                            {
                                                iconCls: 'x-fa fa-ellipsis-h',
                                                tooltip: 'Detalhes',
                                                handler: 'openDetail'
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
