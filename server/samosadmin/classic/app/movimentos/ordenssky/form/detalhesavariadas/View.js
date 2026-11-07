Ext.define('SamosAdmin.movimentos.ordenssky.form.detalhesavariados.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyformdetalhesavariados',

    requires: [
        'SamosAdmin.movimentos.ordenssky.form.detalhesavariados.ViewModel',
        'SamosAdmin.movimentos.ordenssky.form.detalhesavariados.ViewController'
    ],

    title: 'Serviços a Executar - Detalhes',

    controller: 'ordensskyformdetalhesavariados',
    viewModel: 'ordensskyformdetalhesavariados',

    width: 760,
    height: 278,

    leftbuttons: [
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
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
                                    fieldLabel: 'Referência',
                                    maxLength: 50,
                                    width: 100,
                                    reference: 'referencia',
                                    proximoFoco: 'sigla',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 65,
                                    xtype: 'combobox',
                                    fieldLabel: 'Sigla',
                                    reference: 'sigla',
                                    proximoFoco: 'descricao',
                                    displayField: 'field2',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENSAVARIADOS_SIGLA}'
                                    },
                                    store: [
                                        'AC',
                                        'PS',
                                        'AP',
                                        'PP',
                                        'PO',
                                        'SB',
                                        'RV',
                                        'RM',
                                        'RO',
                                        'RS',
                                        'RT',
                                        'SCL',
                                        'SCD',
                                        'SPE'
                                    ]
                                },
                                {
                                    fieldLabel: 'Serviços',
                                    maxLength: 50,
                                    flex: 1,
                                    reference: 'descricao',
                                    proximoFoco: 'modelo',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_DESCRICAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 75,
                                    fieldLabel: 'AF',
                                    reference: 'situacao',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_SITUACAO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Firme',
                                    checked: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Modelo',
                                    maxLength: 50,
                                    flex: 1,
                                    reference: 'modelo',
                                    proximoFoco: 'agendamento',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_MODELO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Agendamento',
                                    reference: 'agendamento',
                                    proximoFoco: 'horaagendada',
                                    width: 95,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_AGENDADA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    reference: 'horaagendada',
                                    proximoFoco: 'execucao',
                                    maxLength: 5,
                                    flex: false,
                                    width: 60,
                                    fieldStyle: 'text-align:center;',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENSAVARIADOS_HORAAGENDADA}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Execução',
                                    reference: 'execucao',
                                    proximoFoco: 'horaexecucao',
                                    width: 123,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENSAVARIADOS_EXECUCAO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    reference: 'horaexecucao',
                                    proximoFoco: 'serial',
                                    maxLength: 5,
                                    flex: false,
                                    width: 75,
                                    fieldStyle:'text-align:center;',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENSAVARIADOS_HORAEXECUCAO}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Serial',
                                    maxLength: 50,
                                    flex: 1,
                                    reference: 'serial',
                                    proximoFoco: 'cartao',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_SERIAL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Cartão',
                                    maxLength: 50,
                                    flex: 0.8,
                                    reference: 'cartao',
                                    proximoFoco: 'limite',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_CARTAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Criação',
                                    reference: 'criacao',
                                    proximoFoco: 'horacriacao',
                                    width: 95,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_CRIACAO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    reference: 'horacriacao',
                                    proximoFoco: 'limite',
                                    maxLength: 5,
                                    flex: false,
                                    width: 60,
                                    fieldStyle: 'text-align:center;',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ORDENSAVARIADOS_HORACRIACAO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Limite',
                                    reference: 'limite',
                                    proximoFoco: 'horalimite',
                                    width: 123,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENSAVARIADOS_LIMITE}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    reference: 'horalimite',
                                    proximoFoco: 'gravar',
                                    clicarNoProximoFoco: true,
                                    maxLength: 5,
                                    flex: false,
                                    width: 75,
                                    fieldStyle:'text-align:center;',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENSAVARIADOS_HORALIMITE}'
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
