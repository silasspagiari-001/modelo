Ext.define('SamosAdmin.movimentos.caixa.sangria.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formcaixasangria',

    requires: [
        'SamosAdmin.movimentos.caixa.sangria.ViewModel',
        'SamosAdmin.movimentos.caixa.sangria.ViewController'
    ],

    title: 'Sangria Caixa',

    width: 600,
    height: 370,  // 355

    rightbuttons: [
        'Confirmar',
        'Sair'
    ],
    
    listeners: {
        afterrender: 'doDefaultFocus'
    },

    initComponent: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Saldos Sangria',
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Dinheiro',
                                    reference: 'valordinheiro',
                                    proximoFoco: 'valorcheque',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorDinheiro}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Cheque',
                                    reference: 'valorcheque',
                                    proximoFoco: 'valorcredito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorCheque}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Cartão Crédito',
                                    reference: 'valorcredito',
                                    proximoFoco: 'valordebito',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorCredito}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Cartão Débito',
                                    reference: 'valordebito',
                                    proximoFoco: 'valorcreditoloja',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorDebito}',
                                        readOnly: '{readOnly}'
                                    }
                                }                                
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Crédito Loja',
                                    reference: 'valorcreditoloja',
                                    proximoFoco: 'valoralimentacao',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorCreditoloja}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Alimentação',
                                    reference: 'valoralimentacao',
                                    proximoFoco: 'valorrefeicao',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorAlimentacao}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Refeição',
                                    reference: 'valorrefeicao',
                                    proximoFoco: 'valorpresente',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorRefeicao}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Presente',
                                    reference: 'valorpresente',
                                    proximoFoco: 'valorcombustivel',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorPresente}',
                                        readOnly: '{readOnly}'
                                    }
                                }                                
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Combustível',
                                    reference: 'valorcombustivel',
                                    proximoFoco: 'valorduplicata',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorCombustivel}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Duplicata',
                                    reference: 'valorduplicata',
                                    proximoFoco: 'valorboleto',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorDuplicata}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Transfer. Banco/Pix',
                                    reference: 'valortransf',
                                    proximoFoco: 'valoroutro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorTransf}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: configs.getFinanceiros().labelOutro,
                                    reference: 'valoroutro',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{valorOutro}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Conta',
                                    reference: 'conta',
                                    flex: 4,
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'PORTADORES_NOME',
                                    valueField: 'PORTADORES_ID',
                                    bind: {
                                        value: '{selectedPortador}',
                                        store: '{portadores}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
            ]
        });

        this.callParent(arguments);
    }
});
