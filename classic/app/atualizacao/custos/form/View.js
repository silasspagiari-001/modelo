Ext.define('SamosAdmin.atualizacao.custos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formcustos',

    title: 'Centros de Custo',

    requires: [
        'SamosAdmin.atualizacao.custos.form.ViewModel'
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
                                    width: 85,
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
                                    width: 75,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.CUSTOS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 2,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'mascara',
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.CUSTOS_NOME}',
                                        readOnly: '{readOnly}'
                                    },
                                },
                                {
                                    flex: 1,
                                    maxLength: 13,
                                    reference: 'mascara',
                                    proximoFoco: 'tipo_custo',
                                    fieldLabel: 'Máscara',
                                    bind: {
                                        value: '{model.CUSTOS_MASCARA}',
                                        readOnly: '{readOnly}'
                                    },
                                },
                                {
                                    width: 200,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo_custo',
                                    proximoFoco: 'gravar',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['D', 'Despesa'],
                                        ['R', 'Receita']
                                    ],
                                    bind: {
                                        value: '{model.CUSTOS_TIPO}',
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
