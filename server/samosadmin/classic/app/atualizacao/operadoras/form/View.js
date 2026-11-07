Ext.define('SamosAdmin.atualizacao.operadoras.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formoperadoras',

    title: 'Operadora',

    requires: [
        'SamosAdmin.atualizacao.operadoras.form.ViewModel'
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
                                    width: 70,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.OPERADORAS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    width: 140,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'nome',
                                    displayField: 'field2',
                                    store: [
                                        ['C', 'Crédito'],
                                        ['D', 'Débito']
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.OPERADORAS_TIPO}'
                                    }
                                },
                                {
                                    flex: 1,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'avista',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.OPERADORAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 75,
                                    reference: 'avista',
                                    proximoFoco: 'parcelado',
                                    enableKeyEvents: true,
                                    fieldLabel: 'À Vista',
                                    maxValue: 100.00,
                                    bind: {
                                        value: '{model.OPERADORAS_AVISTA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 75,
                                    reference: 'parcelado',
                                    proximoFoco: 'parcelado',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Parcelado',
                                    maxValue: 100.00,
                                    bind: {
                                        value: '{model.OPERADORAS_PARCELADO}',
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
