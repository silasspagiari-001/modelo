Ext.define('SamosAdmin.movimentos.cupomeletronico.form.caixa.cheques.detalhes.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formcupomeletronicocaixachequesdetalhes',

    mixins: [
        'SamosModule.TextSearchController'
    ],

    requires: [
        'SamosAdmin.movimentos.cupomeletronico.form.caixa.cheques.detalhes.ViewModel',
        'SamosAdmin.movimentos.cupomeletronico.form.caixa.cheques.detalhes.ViewController'
    ],

    title: 'Detalhes - Cheque',
    height: 455,

    rightbuttons: [
        'Confirmar',
        'Cancelar',
        'Sair'
    ],

    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {   
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Banco',
                                    tabela: 'bancos',
                                    reference: 'banco',
                                    proximoFoco: 'agencia',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['BANCOS_NOME',       'BANCOS_NOME'],
                                        ['CHEQUES_ID_BANCOS', 'BANCOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.BANCOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CHEQUES_ID_BANCOS}'
                                    }
                                },
                                {
                                    width: 85,
                                    reference: 'agencia',
                                    proximoFoco: 'conta',
                                    fieldLabel: 'Agência',
                                    maxLength: 4,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CHEQUES_AGENCIA}'
                                    }
                                },
                                {
                                    width: 85,
                                    reference: 'conta',
                                    proximoFoco: 'numerocheque',
                                    fieldLabel: 'Conta',
                                    maxLength: 10,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CHEQUES_CONTA}'
                                    }
                                },
                                {
                                    width: 85,
                                    reference: 'numerocheque',
                                    proximoFoco: 'vencimento',
                                    fieldLabel: 'N.º Cheque',
                                    maxLength: 6,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CHEQUES_NUMERO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 135,
                                    fieldLabel: 'Vencimento',
                                    reference: 'vencimento',
                                    proximoFoco: 'valor',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CHEQUES_VENCIMENTO}'
                                    }
                                },
                                {
                                    width: 135,
                                    fieldLabel: 'Valor',
                                    reference: 'valor',
                                    proximoFoco: 'nome',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CHEQUES_VALOR}'
                                    }
                                }
                            ]
                        },
                        {   
                            items: [
                                {
                                    flex: 1,
                                    reference: 'nome',
                                    proximoFoco: 'cpfcnpj',
                                    fieldLabel: 'Nome',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CHEQUES_NOME}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    width: 155,
                                    fieldLabel: 'CPF/CNPJ',
                                    reference: 'cpfcnpj',
                                    proximoFoco: 'cep',
                                    bind: {
                                        value: '{model.CHEQUES_CPFCNPJ}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 135,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['A', 'Aberto'],
                                        ['B', 'Baixado'],
                                        ['R', 'Renegociado'],
                                        ['D', 'Devolvido'],
                                        ['C', 'Custódia']
                                    ],
                                    bind: {
                                        value: '{model.CHEQUES_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '_____-___',
                                    width: 100,
                                    fieldLabel: 'CEP',
                                    reference: 'cep',
                                    proximoFoco: 'telefone',
                                    maxLength: 9,
                                    bind: {
                                        value: '{model.CHEQUES_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'onSearchCeps',
                                        validitychange: function (txt) {
                                            txt.clearInvalid();
                                        }
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Cidade',
                                    tabela: 'cidades',
                                    reference: 'cidade',
                                    proximoFoco: 'endereco',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'validarCidade',
                                    associations: [
                                        ['CIDADES_NOME',       'CIDADES_NOME'],
                                        ['CHEQUES_ID_CIDADES', 'CIDADES_ID'],
                                        ['CIDADES_ESTADO',     'CIDADES_ESTADO'],
                                        ['CIDADES_IBGE',       'CIDADES_IBGE']
                                    ],
                                    bind: {
                                        value: '{model.CIDADES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CHEQUES_ID_CIDADES}'
                                    }
                                },
                                {
                                    width: 45,
                                    fieldLabel: 'UF',
                                    reference: 'uf',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}'
                                    }
                                },
                                {
                                    width: 135,
                                    fieldLabel: 'Telefone',
                                    xtype: 'samoswidgets-maskfield',
                                    reference: 'telefone',
                                    proximoFoco: 'endereco',
                                    textMask: '(__) ____-____',
                                    bind: {
                                        value: '{model.CHEQUES_TELEFONE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CIDADES_IBGE}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 50,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.CHEQUES_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'bairro',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.CHEQUES_NRORESIDENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Bairro',
                                    reference: 'bairro',
                                    proximoFoco: 'celular',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.CHEQUES_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 135,
                                    fieldLabel: 'Celular',
                                    reference: 'celular',
                                    proximoFoco: 'observacoes',
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    bind: {
                                        value: '{model.CHEQUES_CELULAR}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'textarea',
                                    fieldLabel: 'Observações',
                                    flex: 1,
                                    height: 118,
                                    maxLength: 512,
                                    reference: 'observacoes',
                                    bind: {
                                        value: '{model.CHEQUES_OBSERVACOES}',
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
