Ext.define('SamosAdmin.movimentos.notificacao.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formnotificacao',

    title: 'Notificação',

    requires: [
        'SamosAdmin.movimentos.notificacao.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Reagendar'
    ],

    rightbuttons: [
        'Enviar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const alturaTextAreaMsg = innerHeight - 450;
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Dados Básicos',
                    items: [
                        {
                            items: [
                                {
                                    fieldLabel: 'Status',
                                    width: 125,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'status',
                                    proximoFoco: 'descricao',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.NOTIFICACAO_STATUS}'
                                    },
                                    store: [
                                        ['N', 'Não Lida'],
                                        ['L', 'Lida'],
                                        ['R', 'Reagendada']
                                    ],
                                    forceSelection: true,
                                    enableKeyEvents: true
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Descrição',
                                    reference: 'descricao',
                                    proximoFoco: 'dataavisar',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.NOTIFICACAO_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 130,
                                    flex: false,
                                    xtype: 'datefield',
                                    fieldLabel: 'Data Criação',
                                    proximoFoco: 'horacriacao',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    reference: 'envio',
                                    bind: {
                                        value: '{model.NOTIFICACAO_DATACRIACAO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora Criação',
                                    width: 100,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'horacriacao',
                                    proximoFoco: 'usuarioorigem',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.NOTIFICACAO_HORACRIACAO}',
                                    },
                                    store: SamosUtils.Info.getHorarios(),
                                    forceSelection: true,
                                    enableKeyEvents: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Usuário Origem',
                                    tabela: 'usuarios',
                                    reference: 'usuarioorigem',
                                    proximoFoco: 'dataavisar',
                                    readOnly: true,
                                    naoFocarAposPesquisar: true,
                                    ui: 'field-readonly',                                   
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOMEORIGEM',     'USUARIOS_NOME'],
                                        ['NOTIFICACAO_ID_USUARIOS', 'USUARIOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.USUARIOS_NOMEORIGEM}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.NOTIFICACAO_ID_USUARIOS}'
                                    }
                                },
                                {
                                    width: 130,
                                    flex: false,
                                    xtype: 'datefield',
                                    fieldLabel: 'Data Avisar',
                                    proximoFoco: 'horaavisar',
                                    reference: 'dataavisar',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.NOTIFICACAO_DATAAVISAR}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora Avisar',
                                    width: 100,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'horaavisar',
                                    proximoFoco: 'enviarpara',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.NOTIFICACAO_HORAAVISAR}',
                                    },
                                    store: SamosUtils.Info.getHorarios(),
                                    forceSelection: true,
                                    enableKeyEvents: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    width: 100,
                                    fieldLabel: 'SMS',
                                    reference: 'sms',
                                    bind: {
                                        value: '{model.NOTIFICACAO_SMS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Enviar',
                                    checked: true
                                },
                                {
                                    fieldLabel: 'Enviar Para',
                                    width: 125,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'enviarpara',
                                    proximoFoco: 'usuariodestino',
                                    bind: {
                                        readOnly: '{readOnlyParaTodos}',
                                        value: '{model.NOTIFICACAO_TODOS}',
                                        ui: '{readOnlyParaTodos ? "field-readonly" : "textbold-' + tema + '"}'
                                    },
                                    store: (() => {
                                        const padrao = [
                                            ['T', 'Todos'],
                                            ['F', 'Individual']
                                        ];

                                        return padrao.concat(configs.getUsuarios().tipos || []);
                                    })(),
                                    forceSelection: true,
                                    enableKeyEvents: true
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Usuário Destino',
                                    tabela: 'usuarios',
                                    reference: 'usuariodestino',
                                    proximoFoco: 'mensagem',
                                    naoFocarAposPesquisar: true,                                  
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOMEDESTINO',    'USUARIOS_NOME'],
                                        ['NOTIFICACAO_ID_DESTINO',  'USUARIOS_ID'],
                                        ['USUARIOS_CELULARDESTINO', 'USUARIOS_CELULAR']
                                    ],
                                    bind: {
                                        value: '{model.USUARIOS_NOMEDESTINO}',
                                        readOnly: '{readOnlyUsuarioDestino}',
                                        ui: '{readOnlyUsuarioDestino ? "field-readonly" : "textbold-' + tema + '"}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: 'Celular',
                                    reference: 'celular',
                                    proximoFoco: 'mensagem',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_CELULARDESTINO}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.NOTIFICACAO_ID_DESTINO}'
                                    }
                                },
                                {
                                    width: 130,
                                    flex: false,
                                    xtype: 'datefield',
                                    fieldLabel: 'Data Leitura',
                                    readOnly: true,
                                    proximoFoco: 'horaleitura',
                                    ui: 'field-readonly',
                                    reference: 'dataleitura',
                                    bind: {
                                        value: '{model.NOTIFICACAO_DATALEITURA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora Leitura',
                                    width: 100,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'horaleitura',
                                    proximoFoco: 'mensagem',
                                    readOnly: true,
                                    emptyText: '',
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.NOTIFICACAO_HORALEITURA}',
                                    },
                                    store: SamosUtils.Info.getHorarios(),
                                    forceSelection: true,
                                    enableKeyEvents: true
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Mensagem',
                    items: [
                        {
                            height: alturaTextAreaMsg,
                            items: [
                                {
                                    reference: 'mensagem',
                                    proximoFoco: 'save',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.NOTIFICACAO_MENSAGEM}'
                                    },
                                    maxLength: 5120,                                    
                                    xtype : 'textareafield',
                                    height: alturaTextAreaMsg,
                                    anchor: '100%',
                                    grow  : true,
                                    width : '100%'
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
