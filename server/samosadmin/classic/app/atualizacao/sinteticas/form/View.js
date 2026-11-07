Ext.define('SamosAdmin.atualizacao.sinteticas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formsinteticas',

    title: 'Aplicação Sintética',

    requires: [
        'SamosAdmin.atualizacao.sinteticas.form.ViewModel'
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
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Aplicação Sintética',
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 85,
                                    fieldLabel: 'Reduzido',
                                    reference: 'codigo',
                                    bind: {
                                        value: '{modelId}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: 1,
                                    maxLength: 13,
                                    reference: 'mascara',
                                    proximoFoco: 'nome',
                                    fieldLabel: 'Máscara',
                                    emptyText: '0.00.000',
                                    bind: {
                                        value: '{model.APLICACOES_MASCARA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'onChangeMascara'
                                    }
                                },
                                {
                                    flex: 2,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'tipo_aplicacao',
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.APLICACOES_NOME}',
                                        readOnly: '{readOnly}'
                                    },
                                },
                                {
                                    width: 130,
                                    flex: false,
                                    xtype: 'textfield',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo_aplicacaoro',
                                    proximoFoco: 'gravar',
                                    hidden: configs.getClientName() == 'eleve',
                                    editable: false,
                                    readOnly: true
                                },
                                {
                                    width: 130,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo_aplicacao',
                                    proximoFoco: 'gravar',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    hidden: configs.getClientName() != 'eleve',
                                    store: [
                                        ['D', 'Despesa'],
                                        ['R', 'Receita'],
                                        ['C', 'Custos'],
                                        ['U', 'Deduções']
                                    ],
                                    bind: {
                                        value: '{model.APLICACOES_TIPO}',
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
