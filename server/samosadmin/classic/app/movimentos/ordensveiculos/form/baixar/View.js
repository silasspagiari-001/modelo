Ext.define('SamosAdmin.movimentos.ordensveiculos.form.baixar.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formordensveiculosbaixar',

    requires: [
        'SamosAdmin.movimentos.ordensveiculos.form.baixar.ViewModel',
        'SamosAdmin.movimentos.ordensveiculos.form.baixar.ViewController'
    ],

    title: 'Baixar Ordem de Serviço',

    controller: 'formordensveiculosbaixar',
    viewModel: 'formordensveiculosbaixar',

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