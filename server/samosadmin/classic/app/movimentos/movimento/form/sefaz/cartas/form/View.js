Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.cartas.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentossefazformcartas',

    requires: [
        'SamosAdmin.movimentos.movimento.form.sefaz.cartas.form.ViewModel',
        'SamosAdmin.movimentos.movimento.form.sefaz.cartas.form.ViewController'
    ],

    title: 'Carta de Correção',
    hidePaging: true,
    width: 810,
    height: 510,

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Enviar',
        'Emitir',
        'Email'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    bind: {
                        hidden: '{showXmlView}'
                    },
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 80,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_STATUS}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Enviado'
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Descrição',
                                    reference: 'descricao',
                                    proximoFoco: 'emissao',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Chave',
                                    reference: 'chave',
                                    proximoFoco: 'emissao',
                                    maxLength: 60,
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_NFE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 200,
                                    fieldLabel: 'Protocolo',
                                    reference: 'descricao',
                                    proximoFoco: 'emissao',
                                    maxLength: 50,
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_PROTOCOLO}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 130,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'correcoes',
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_EMISSAO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'datefield'
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Envio',
                                    reference: 'envio',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_ENVIO}'
                                    },
                                    xtype: 'datefield'
                                },
                                {
                                    flex: false,
                                    width: 85,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_HORA}'
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    flex: 1,
                                    fieldLabel: 'Log',
                                    reference: 'log',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_LOG}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    flex: 1,
                                    height: 220,
                                    lineHeight: 31,
                                    lines: 10,
                                    maxLength: 50,
                                    minLength: 25, // 15 caracteres e 10 pipes
                                    reference: 'correcoes',
                                    proximoFoco: 'gravar',
                                    bind: {
                                        value: '{model.MOVIMENTOSCARTAS_CORRECOES}',
                                        readOnly: '{readOnly}'
                                    },
                                    anchor: '100%',
                                    grow  : true,
                                    width : '100%'
                                }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'samoswidgets-defaultform',
                    padding: '10 20 10 20',
                    ui: 'formpanel-clean-' + tema,
                    bind: {
                        hidden: '{!showXmlView}'
                    },
                    items: [
                        {   
                            xtype: 'fieldcontainer',
                            anchor: '100%',
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'textarea',
                                    height: 322,
                                    fieldStyle: {
                                        whiteSpace: 'pre',
                                        fontFamily: 'monospace'
                                    },
                                    flex: 1,
                                    fieldLabel: 'Reposta TXT',
                                    readOnly: true,
                                    bind: {
                                        value: '{respostaTxt}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
                                    fieldStyle: {
                                        whiteSpace: 'pre',
                                        color: 'blue',
                                        fontStyle: 'italic'
                                    },
                                    flex: 1,
                                    height: 322,
                                    fieldLabel: 'Resposta XML',
                                    readOnly: true,
                                    bind: {
                                        value: '{respostaXml}'
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
