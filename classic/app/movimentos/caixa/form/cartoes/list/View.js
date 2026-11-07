Ext.define('SamosAdmin.movimentos.caixa.form.cartoes.list.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formcaixacartoes',

    requires: [
        'SamosAdmin.movimentos.caixa.form.cartoes.list.ViewModel',
        'SamosAdmin.movimentos.caixa.form.cartoes.list.ViewController'
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
                            height: 420,
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
                                        width : 120,
                                        flex: false,
                                        align: 'right',
                                        editor: {
                                            xtype: 'samoswidgets-textsearch',
                                            tabela: 'operadoras',
                                            flex: false,
                                            reference: 'operadorasId',
                                            proximoFoco: 'tipo',
                                            callbackFn: 'setTaxaParcelas',
                                            buscarPor: 'Código',
                                            permitirApenasNumeros: true,
                                            associations:[
                                                ['CARTOES_ID_OPERADORAS', 'OPERADORAS_ID'],
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
                                        width : 110,
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
                                                readOnly: '{readOnly}'
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
                                            xtype: 'combobox',
                                            flex: false,
                                            width: 110,
                                            editable: false,
                                            reference: 'convenio',
                                            proximoFoco: 'autorizacao',
                                            store: configs.getMaquinasCartao(),
                                            enableKeyEvents: true,
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
                                            xtype: 'numberfield',
                                            flex: false,
                                            width: 120,
                                            reference: 'autorizacao',
                                            proximoFoco: 'parcelas',
                                            minValue: 0,
                                            decimalPrecision: 0,
                                            hideTrigger: true,
                                            fieldStyle: 'text-align: right;',
                                            enableKeyEvents: true,
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
                                            minValue: 0,
                                            decimalPrecision: 0,
                                            hideTrigger: true,
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
                                        text: 'R$ Total',
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
