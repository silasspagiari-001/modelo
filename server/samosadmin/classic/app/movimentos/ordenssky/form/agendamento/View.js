Ext.define('SamosAdmin.movimentos.ordenssky.form.agendamento.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyformagendamento',

    requires: [
        'SamosAdmin.movimentos.ordenssky.form.agendamento.ViewModel',
        'SamosAdmin.movimentos.ordenssky.form.agendamento.ViewController'
    ],

    title: 'Agendamento',

    controller: 'ordensskyformagendamento',
    viewModel: 'ordensskyformagendamento',

    width: 600,
    height: 330,

    leftbuttons: [
        {
            action: 'Selecionar Rota',
            ui: 'primary-blue'
        },
        'Alterar Rota'
    ],

    rightbuttons: [
        'Gravar',
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
                                    fieldLabel: 'Rota',
                                    reference: 'rota',
                                    flex: 1,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{agendamento.ORDENSROTAS_NOME}'
                                    }
                                },
                                {
                                    fieldLabel: 'Dia',
                                    reference: 'rota',
                                    width: 80,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{agendamento.DIA_SEMANA}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Agendamento',
                                    reference: 'agendamento',
                                    width: 100,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{agendamento.ORDENSAVARIADOS_AGENDADA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    reference: 'horaagendada',
                                    proximoFoco: 'contato',
                                    maxLength: 5,
                                    width: 55,
                                    fieldStyle: 'text-align:center;',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{agendamento.ORDENSAVARIADOS_HORAAGENDADA}'
                                    }
                                },
                                {
                                    width: 75,
                                    fieldLabel: 'AF',
                                    reference: 'situacao',
                                    bind: {
                                        value: '{agendamento.ORDENSAVARIADOS_SITUACAO}',
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
                                    fieldLabel: 'Técnico',
                                    flex: 1,
                                    reference: 'usuario',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{agendamento.USUARIOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },        
                                {
                                    hidden: true,
                                    reference: 'idusuario',
                                    bind: {
                                        value: '{agendamento.ORDENS_ID_USUARIOS}'
                                    }
                                },        
                                {
                                    hidden: true,
                                    reference: 'idrotas',
                                    bind: {
                                        value: '{agendamento.ORDENS_ID_ORDENSROTAS}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    editable: false,
                                    fieldLabel: 'Status',
                                    width: 237,
                                    reference: 'status',
                                    proximoFoco: 'referencia',
                                    displayField: 'field2',
                                    store: [
                                        ['1', 'Tratativa Manual'],
                                        ['2', 'Aberta'],
                                        ['3', 'Desconhecido'],
                                        ['4', 'Aceita'],
                                        ['5', 'Em deslocamento'],
                                        ['6', 'Em execucao'],
                                        ['7', 'Concluida com sucesso'],
                                        ['8', 'Concluida sem sucesso'],
                                        ['9', 'Cancelada'],
                                        ['0', 'Realocada']
                                    ],
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{agendamento.ORDENS_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Contato',
                                    flex: 1,
                                    maxLength: 50,
                                    reference: 'contato',
                                    proximoFoco: 'celular',
                                    bind: {
                                        value: '{agendamento.contato}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    width: 120,
                                    textMask: '(__) _____-____',
                                    reference: 'celular',
                                    proximoFoco: 'referencia',
                                    fieldLabel: 'Celular',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{agendamento.celular}'
                                    }
                                },
                                {
                                    fieldLabel: 'Ponto de Referência',
                                    maxLength: 50,
                                    width: 237,
                                    reference: 'referencia',
                                    proximoFoco: 'observacoes',
                                    bind: {
                                        value: '{agendamento.referencia}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Observações',
                                    maxLength: 50,
                                    reference: 'observacoes',
                                    proximoFoco: 'gravar',
                                    clicarNoProximoFoco: true,
                                    bind: {
                                        value: '{agendamento.observacoes}',
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
