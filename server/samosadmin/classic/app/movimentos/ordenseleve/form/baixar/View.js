Ext.define('SamosAdmin.movimentos.ordenseleve.form.baixar.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formordenselevebaixar',

    requires: [
        'SamosAdmin.movimentos.ordenseleve.form.baixar.ViewModel',
        'SamosAdmin.movimentos.ordenseleve.form.baixar.ViewController'
    ],

    title: 'Baixar Ordem de Serviço',

    controller: 'formordenselevebaixar',
    viewModel: 'formordenselevebaixar',

    width: 450,
    height: 460,

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
                                    proximoFoco: 'qtde',
                                    buscarPor: 'Genérica',
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
                                    proximoFoco: 'qtde',
                                    buscarPor: 'Contéudo',
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
                                    proximoFoco: 'qtde',
                                    buscarPor: 'Genérica',
                                    bind: {
                                        value: '{model.PRAZOS_NOME}'
                                    },
                                    associations: [
                                        ['PRAZOS_NOME',           'PRAZOS_NOME'],
                                        ['FINANCEIROS_ID_PRAZOS', 'PRAZOS_ID'],
                                        ['PRAZOS_PARCELAS',       'PRAZOS_PARCELAS'],
                                        ['PRAZOS_PARCELAMENTO',   'PRAZOS_PARCELAMENTO']
                                    ]           
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
                        {  // agora sim, as datas
                            items: [
                                {
                                    flex: false,
                                    width: 137,
                                    fieldLabel: 'Data Emissão',
                                    reference: 'emissaotitulo',
                                    proximoFoco: 'vctotitulo',
                                    xtype: 'datefield',
                                    bind: {
                                        value: '{model.FINANCEIROS_EMISSAO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'onEmissaoChange'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 137,
                                    fieldLabel: 'Data Vencimento',
                                    reference: 'vctotitulo',
                                    xtype: 'datefield',
                                    bind: {
                                        value: '{model.FINANCEIROS_VENCIMENTO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }, // fim do novo
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