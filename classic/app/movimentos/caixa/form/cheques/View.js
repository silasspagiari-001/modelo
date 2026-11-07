Ext.define('SamosAdmin.movimentos.caixa.form.cheques.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formcaixacheques',

    requires: [
        'SamosAdmin.movimentos.caixa.form.cheques.ViewModel',
        'SamosAdmin.movimentos.caixa.form.cheques.ViewController'
    ],

    title: 'Cheques',
    modelName: 'SamosFinanceiros.cheques.Model',
    hidePaging: true,

    listeners: {
        afterrender: 'loadCheques'
    },

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Confirmar',
        'Sair'
    ],

    formgroups: [
        {
            items: [
                {   
                    items: [
                        {
                            flex: false,
                            width: 80,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Banco',
                            proximoFoco: 'agencia',
                            maxLength: 3,
                            tabela: 'bancos',
                            reference: 'banco',
                            buscarPor: 'Código',
                            associations: [
                                ['CHEQUES_ID_BANCOS', 'BANCOS_ID']
                            ],
                            bind: {
                                value: '{model.CHEQUES_ID_BANCOS}',
                                readOnly: '{readOnly}'
                            }
                        },
                        {
                            flex: false,
                            width: 60,
                            fieldLabel: 'Agência',
                            reference: 'agencia',
                            proximoFoco: 'conta',
                            maxLength: 4,
                            bind: {
                                value: '{model.CHEQUES_AGENCIA}',
                                readOnly: '{readOnly}'
                            }
                        },     
                        {
                            flex: false,
                            width: 105,
                            fieldLabel: 'Conta',
                            reference: 'conta',
                            proximoFoco: 'numero',
                            maxLength: 10,
                            bind: {
                                value: '{model.CHEQUES_CONTA}',
                                readOnly: '{readOnly}'
                            },
                            listeners: {
                                blur: function () {
                                    this.setValue(("0000000000" + this.getValue()).slice(-10));
                                }
                            }                    
                        },
                        {
                            flex: false,
                            width: 70,
                            fieldLabel: 'Cheque nº',
                            maxLength: 6,
                            reference: 'numero',
                            proximoFoco: 'cpf',
                            bind: {
                                value: '{model.CHEQUES_NUMERO}', 
                                readOnly: '{readOnly}'
                            },
                            listeners: {
                                blur: function () {
                                    this.setValue(("000000" + this.getValue()).slice(-6));
                                }
                            },
                    
                        },     
                        {
                            xtype: 'samoswidgets-maskfield',
                            textMask: [
                                '___.___.___-__',
                                '__.___.___/____-__'
                            ],
                            flex: false,
                            width: 155,
                            fieldLabel: 'CPF/CNPJ',
                            reference: 'cpf',
                            proximoFoco: 'prazo',
                            bind: {
                                value: '{model.CHEQUES_CPFCNPJ}',
                                readOnly: '{readOnly}'
                            }
                        },                                                                                          
                        {
                            flex: 1,
                            xtype: 'samoswidgets-textsearch',
                            fieldLabel: 'Prazo',
                            tabela: 'prazos',
                            reference: 'prazo',
                            proximoFoco: 'serie',
                            buscarPor: 'Genérica',
                            associations: [
                                ['PRAZOS_NOME',          'PRAZOS_NOME'],
                                ['MOVIMENTOS_ID_PRAZOS', 'PRAZOS_ID'],
                                ['PRAZOS_PARCELAS',      'PRAZOS_PARCELAS'],
                                ['PRAZOS_PARCELAMENTO',  'PRAZOS_PARCELAMENTO']
                            ],
                            bind: {
                                value: '{model.PRAZOS_NOME}',
                                readOnly: '{readOnly}'
                            },
                            callbackFn: 'gerarCheques'
                        },
                        {
                            hidden: true,
                            bind: {
                                value: '{model.MOVIMENTOSCAIXA_ID_PRAZOS}'
                            }
                        },
                        {
                            flex: false,
                            width: 65,
                            fieldLabel: 'Parcelas',
                            readOnly: true,
                            ui: 'field-readonly',
                            bind: {
                                value: '{model.PRAZOS_PARCELAS}'
                            }
                        }
                    ]
                }
            ]
        },
        {
            layout: 'fit',
            items: [
                {
                    xtype: 'grideditable',
                    height: 325,
                    hideButtons: true,
                    hideNumberer: true,
                    addAfterSave: false,
                    reference: 'cheques',
                    bind: {
                        store: '{main}'
                    },
                    columns: {
                        items: [
                            {
                                text: 'Cheque',
                                dataIndex: 'CHEQUES_NUMERO',
                                width : 80,
                                flex: false,
                                align: 'center',
                                editor: {
                                    flex: false,
                                    width: 70,
                                    maxLength: 6,
                                    fieldStyle: 'text-align:right;',
                                    proximoFoco: 'vencimento',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }
                            },                            
                            {
                                text: 'Vencimento',
                                dataIndex: 'CHEQUES_VENCIMENTO',
                                xtype: 'datecolumn',
                                width : 135,
                                flex: false,
                                align: 'center',
                                editor: {
                                    xtype: 'datefield',
                                    flex: false,
                                    width: 135,
                                    fieldStyle: 'text-align:center;',
                                    reference: 'vencimento',
                                    proximoFoco: 'valor',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }
                            },
                            {
                                flex: false,
                                width : 135,
                                xtype: 'moneycolumn',
                                text: 'Valor',
                                dataIndex: 'CHEQUES_VALOR',
                                editor: {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 135,
                                    reference: 'valor',
                                    proximoFoco: 'observacoes',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                }
                            },
                            {
                                text: 'Observações',
                                dataIndex: 'CHEQUES_OBSERVACOES',
                                flex : 1,
                                editor: {
                                    xtype: 'textfield',
                                    reference: 'observacoes',
                                    maxLength: 512
                                }
                            }
                        ]
                    }
                }
            ]
        }
    ]
});
