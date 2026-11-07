Ext.define('SamosAdmin.atualizacao.prazos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formprazos',

    title: 'Prazo',

    requires: [
        'SamosAdmin.atualizacao.prazos.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Dados Básicos',
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 80,
                                    fieldLabel: 'Código',
                                    reference: 'codigo',
                                    bind: {
                                        value: '{modelId}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: false,
                                    width: 80,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.PRAZOS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 1,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'acrescimo',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.PRAZOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 70,
                                    reference: 'acrescimo',
                                    proximoFoco: 'desconto',
                                    fieldLabel: 'Acrescimo',
                                    bind: {
                                        value: '{model.PRAZOS_ACRESCIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 70,
                                    reference: 'desconto',
                                    proximoFoco: 'parcelas',
                                    fieldLabel: 'Desconto',
                                    bind: {
                                        value: '{model.PRAZOS_DESCONTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'numberfield',
                                    flex: false,
                                    width: 100,
                                    reference: 'intervalo',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    allowDecimals: false,
                                    fieldLabel: 'Intervalo Dias',
                                    bind: {
                                        value: '{model.INTERVALO_DIAS}',
                                        readOnly: '{readOnly}',
                                        hidden: '{hideIntervalo}'
                                    }
                                },
                                {
                                    xtype: 'numberfield',
                                    flex: false,
                                    width: 100,
                                    reference: 'parcelas',
                                    proximoFoco: 'parcelamento',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    allowDecimals: false,
                                    fieldLabel: 'Parcelas',
                                    listeners: {
                                        blur: 'gerarParcelas'
                                    },
                                    bind: {
                                        value: '{model.PRAZOS_PARCELAS}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    maxLength: 512,
                                    reference: 'parcelamento',
                                    proximoFoco: 'save',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Parcelamento',
                                    xtype: 'textarea',
                                    anchor: '100%',
                                    grow  : true,
                                    width : '100%',
                                    bind: {
                                        value: '{model.PRAZOS_PARCELAMENTO}',
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
