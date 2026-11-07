Ext.define('SamosAdmin.movimentos.coletas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formcoletas',

    title: 'Coleta',

    requires: [
        'SamosAdmin.movimentos.coletas.form.ViewModel',
        'SamosAdmin.movimentos.coletas.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Fotos'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function (config) {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Dados da Coleta',
                    ui: 'formpanel-noheader-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Transportador',
                                    tabela: 'usuarios',
                                    reference: 'usuario',
                                    proximoFoco: 'agendada',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_LOGIN',      'USUARIOS_LOGIN'],
                                        ['COLETAS_ID_USUARIOS', 'USUARIOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.USUARIOS_LOGIN}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.COLETAS_ID_USUARIOS}'
                                    }
                                },
                                {
                                    width: 95,
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'horaemissao',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_EMISSAO}',
                                    }
                                },
                                {
                                    width: 55,
                                    fieldLabel: 'Hora',
                                    reference: 'horaemissao',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_HORAEMISSAO}'
                                    }
                                },
                                {
                                    width: 125,
                                    xtype: 'datefield',
                                    fieldLabel: 'Agendada',
                                    reference: 'agendada',
                                    proximoFoco: 'horaagendada',
                                    bind: {
                                        value: '{model.COLETAS_AGENDA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 80,
                                    editable: false,                                            
                                    fieldLabel: 'Hora',
                                    reference: 'horaagendada',
                                    proximoFoco: 'fornecedor',
                                    forceSelection: true,
                                    store: (() => {
                                        const s = moment().hour(23).minute(45);
                                        return new Array(24 * 4).fill(0).map(() => {
                                            return s.add(15, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.COLETAS_HORAAGENDA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 125,
                                    xtype: 'datefield',
                                    fieldLabel: 'Saída',
                                    reference: 'saida',
                                    proximoFoco: 'horasaida',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_SAIDA}',
                                    }
                                },
                                {
                                    width: 55,
                                    fieldLabel: 'Hora',
                                    reference: 'horasaida',
                                    maxLength: 10,
                                    proximoFoco: 'agenda',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_HORASAIDA}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'serie',
                                    fieldStyle:'text-align:right;color:red;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    width: 40,
                                    reference: 'serie',
                                    fieldLabel: 'Série',
                                    maxLength: 3,
                                    fieldStyle: 'color:red;',
                                    bind: {
                                        value: '{model.COLETAS_SERIE}',
                                        readOnly: '{readOnly}'
                                    }
                                }

                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Fornecedor',
                                    tabela: 'pessoas',
                                    reference: 'fornecedor',
                                    proximoFoco: 'placa',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['FORNECEDOR_NOME',       'PESSOAS_NOME'],
                                        ['COLETAS_ID_FORNECEDOR', 'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{model.FORNECEDOR_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.COLETAS_ID_FORNECEDOR}'
                                    }
                                },
                                {
                                    width: 95,
                                    fieldLabel: 'Placa',
                                    reference: 'placa',
                                    maxLength: 10,
                                    proximoFoco: 'especie',
                                    bind: {
                                        value: '{model.COLETAS_PLACA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 205,
                                    fieldLabel: 'Espécie',
                                    reference: 'especie',
                                    maxLength: 20,
                                    proximoFoco: 'quantidade',
                                    bind: {
                                        value: '{model.COLETAS_ESPECIE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 80,
                                    xtype: 'numberfield',
                                    fieldLabel: 'Quantidade',
                                    reference: 'quantidade',
                                    hideTrigger: true,
                                    minValue: 0,
                                    proximoFoco: 'pesoliquido',
                                    fieldStyle:'text-align:right;',
                                    bind: {
                                        value: '{model.COLETAS_QUANTIDADE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 80,
                                    fieldLabel: 'Peso Líquido',
                                    reference: 'pesoliquido',
                                    hideTrigger: true,
                                    decimalPrecision: 3,
                                    minValue: 0,
                                    proximoFoco: 'pesobruto',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    bind: {
                                        value: '{model.COLETAS_PESOLIQUIDO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 80,
                                    fieldLabel: 'Peso Bruto',
                                    reference: 'pesobruto',
                                    proximoFoco: 'cliente',                                    
                                    hideTrigger: true,
                                    decimalPrecision: 3,
                                    minValue: 0,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    bind: {
                                        value: '{model.COLETAS_PESOBRUTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 115,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'numero',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['A', 'Aberto'],
                                        ['E', 'Entregue'],
                                        ['C', 'Cancelada']
                                    ],
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_STATUS}',
                                    }
                                }
                            ]
                        },
                        {
                            items: [ 
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Cliente',
                                    tabela: 'pessoas',
                                    reference: 'cliente',
                                    proximoFoco: 'custo',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['CLIENTE_NOME',       'PESSOAS_NOME'],
                                        ['COLETAS_ID_PESSOAS', 'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{model.CLIENTE_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.COLETAS_ID_PESSOAS}'
                                    }
                                },
                                {
                                    width: 305,
                                    fieldLabel: 'Log',
                                    reference: 'log',
                                    maxLength: 50,
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_LOG}'
                                    }
                                },
                                {
                                    width: 80,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Custo',
                                    reference: 'custo',
                                    proximoFoco: 'valor',
                                    bind: {
                                        value: '{model.COLETAS_CUSTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 80,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Valor',
                                    reference: 'valor',
                                    proximoFoco: 'despesas',
                                    bind: {
                                        value: '{model.COLETAS_VALOR}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 80,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Despesas',
                                    reference: 'despesas',
                                    proximoFoco: 'comissao',
                                    bind: {
                                        value: '{model.COLETAS_DESPESAS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 115,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Total',
                                    reference: 'total',
                                    proximoFoco: 'observacoes',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.COLETAS_TOTAL}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Observações',
                                    reference: 'observacoes',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.COLETAS_OBSERVACOES}',
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
