Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.detalhes.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyrotasdetalhes',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.rotas.detalhes.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.rotas.detalhes.ViewController'
    ],

    title: 'Detalhes da Rota',

    controller: 'ordensskyrotasdetalhes',
    viewModel: 'ordensskyrotasdetalhes',

    width: 450,
    height: 485,

    rightbuttons: [
        'Gravar',
        'Cancelar'
    ],

    initComponent: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    collapsible: false,
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Cidade',
                                    reference: 'cidade',
                                    xtype: 'samoswidgets-textsearch',
                                    buscarPor: 'Genérica',
                                    proximoFoco: 'segunda',
                                    tabela: 'cidades',
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
                                    },
                                    associations:[
                                        ['CIDADES_NOME',           'CIDADES_NOME'],
                                        ['ORDENSROTAS_ID_CIDADES', 'CIDADES_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ORDENSROTAS_ID_CIDADES}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Segunda',
                                    reference: 'segunda',
                                    proximoFoco: 'limitesegunda',
                                    buscarPor: 'Genérica',
                                    tabela: 'usuarios',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_SEGUNDA}'
                                    },
                                    associations:[
                                        ['USUARIOS_SEGUNDA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_SEGUNDA', 'USUARIOS_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_SEGUNDA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Limite OS',
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldStyle: 'text-align:right',
                                    minValue: 1,
                                    width: 70,
                                    reference: 'limitesegunda',
                                    proximoFoco: 'terca',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.LIMITE_SEGUNDA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Já Alocadas',
                                    fieldStyle: 'text-align:right',
                                    width: 70,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ALOCADAS_SEGUNDA}'
                                    }
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.STATUS_SEGUNDA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Terça',
                                    reference: 'terca',
                                    proximoFoco: 'limiteterca',
                                    buscarPor: 'Genérica',
                                    tabela: 'usuarios',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_TERCA}'
                                    },
                                    associations:[
                                        ['USUARIOS_TERCA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_TERCA', 'USUARIOS_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_TERCA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Limite OS',
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldStyle: 'text-align:right',
                                    minValue: 1,
                                    width: 70,
                                    reference: 'limiteterca',
                                    proximoFoco: 'quarta',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.LIMITE_TERCA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Já Alocadas',
                                    fieldStyle: 'text-align:right',
                                    width: 70,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ALOCADAS_TERCA}'
                                    }
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.STATUS_TERCA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Quarta',
                                    reference: 'quarta',
                                    proximoFoco: 'limitequarta',
                                    buscarPor: 'Genérica',
                                    tabela: 'usuarios',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_QUARTA}'
                                    },
                                    associations:[
                                        ['USUARIOS_QUARTA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_QUARTA', 'USUARIOS_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_QUARTA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Limite OS',
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldStyle: 'text-align:right',
                                    minValue: 1,
                                    width: 70,
                                    reference: 'limitequarta',
                                    proximoFoco: 'quinta',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.LIMITE_QUARTA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Já Alocadas',
                                    fieldStyle: 'text-align:right',
                                    width: 70,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ALOCADAS_QUARTA}'
                                    }
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.STATUS_QUARTA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Quinta',
                                    reference: 'quinta',
                                    proximoFoco: 'limitequinta',
                                    buscarPor: 'Genérica',
                                    tabela: 'usuarios',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_QUINTA}'
                                    },
                                    associations:[
                                        ['USUARIOS_QUINTA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_QUINTA', 'USUARIOS_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_QUINTA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Limite OS',
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldStyle: 'text-align:right',
                                    minValue: 1,
                                    width: 70,
                                    reference: 'limitequinta',
                                    proximoFoco: 'sexta',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.LIMITE_QUINTA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Já Alocadas',
                                    fieldStyle: 'text-align:right',
                                    width: 70,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ALOCADAS_QUINTA}'
                                    }
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.STATUS_QUINTA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Sexta',
                                    reference: 'sexta',
                                    proximoFoco: 'limitesexta',
                                    buscarPor: 'Genérica',
                                    tabela: 'usuarios',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_SEXTA}'
                                    },
                                    associations:[
                                        ['USUARIOS_SEXTA',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_SEXTA', 'USUARIOS_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_SEXTA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Limite OS',
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldStyle: 'text-align:right',
                                    minValue: 1,
                                    width: 70,
                                    reference: 'limitesexta',
                                    proximoFoco: 'sabado',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.LIMITE_SEXTA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Já Alocadas',
                                    fieldStyle: 'text-align:right',
                                    width: 70,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ALOCADAS_SEXTA}'
                                    }
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.STATUS_SEXTA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Sábado',
                                    reference: 'sabado',
                                    proximoFoco: 'limitesabado',
                                    buscarPor: 'Genérica',
                                    tabela: 'usuarios',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_SABADO}'
                                    },
                                    associations:[
                                        ['USUARIOS_SABADO',    'USUARIOS_LOGIN'],
                                        ['USUARIOS_ID_SABADO', 'USUARIOS_ID']
                                    ]
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_SABADO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Limite OS',
                                    xtype: 'numberfield',
                                    hideTrigger: true,
                                    fieldStyle: 'text-align:right',
                                    minValue: 1,
                                    width: 70,
                                    reference: 'limitesabado',
                                    proximoFoco: 'gravar',
                                    clicarNoProximoFoco: true,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.LIMITE_SABADO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Já Alocadas',
                                    fieldStyle: 'text-align:right',
                                    width: 70,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ALOCADAS_SABADO}'
                                    }
                                },
                                {
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.STATUS_SABADO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
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
