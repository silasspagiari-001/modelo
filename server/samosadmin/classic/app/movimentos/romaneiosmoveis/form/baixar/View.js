Ext.define('SamosAdmin.movimentos.romaneiosmoveis.form.baixar.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formromaneiosmoveisbaixar',

    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.form.baixar.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.form.baixar.ViewController'
    ],

    title: 'Baixar Romaneio',

    controller: 'formromaneiosmoveisbaixar',
    viewModel: 'formromaneiosmoveisbaixar',

    width: 450,
    height: 415,

    rightbuttons: [
        'Baixar',
        'Sair'
    ],

    initComponent: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Aplicação',
                                    tabela: 'aplicacoes',
                                    reference: 'aplicacao',
                                    buscarPor: 'Genérica',
                                    proximoFoco: 'portador',
                                    bind: {
                                        value: '{model.APLICACOES_NOME}'
                                    },
                                    associations: [
                                        ['APLICACOES_NOME',           'APLICACOES_NOME'],
                                        ['FINANCEIROS_ID_APLICACOES', 'APLICACOES_ID']
                                    ]           
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.FINANCEIROS_ID_APLICACOES}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Portador',
                                    tabela: 'portadores',
                                    reference: 'portador',
                                    buscarPor: 'Contéudo',
                                    proximoFoco: 'prazo',
                                    bind: {
                                        value: '{model.PORTADORES_NOME}'
                                    },
                                    associations: [
                                        ['PORTADORES_NOME',           'PORTADORES_NOME'],
                                        ['FINANCEIROS_ID_PORTADORES', 'PORTADORES_ID']
                                    ]           
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.FINANCEIROS_ID_PORTADORES}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Prazo',
                                    tabela: 'prazos',
                                    reference: 'prazo',
                                    buscarPor: 'Genérica',
                                    proximoFoco: 'vencimento',
                                    bind: {
                                        value: '{model.PRAZOS_NOME}'
                                    },
                                    associations: [
                                        ['PRAZOS_NOME',           'PRAZOS_NOME'],
                                        ['FINANCEIROS_ID_PRAZOS', 'PRAZOS_ID'],
                                        ['PRAZOS_PARCELAS',       'PRAZOS_PARCELAS'],
                                        ['PRAZOS_PARCELAMENTO',   'PRAZOS_PARCELAMENTO']
                                    ],
                                    listeners: {
                                        blur: 'atualizarVencimento'
                                    }

                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.FINANCEIROS_ID_PRAZOS}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PRAZOS_PARCELAS}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PRAZOS_PARCELAMENTO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 150,
                                    flex: false,
                                    fieldLabel: 'Vencimento',
                                    reference: 'vencimento',
                                    bind: {
                                        value: '{model.FINANCEIROS_VENCIMENTO}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 100,
                                    fieldLabel: 'Valor Total',
                                    reference: 'valortotal',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.FINANCEIROS_ORIGINAL}',
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textarea',
                                    fieldLabel: 'Observações',
                                    flex: 1,
                                    height: 118,
                                    maxLength: 512,
                                    margin: '0 0 10 0',
                                    reference: 'observacoes',
                                    bind: {
                                        value: '{model.FINANCEIROS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
