Ext.define('SamosAdmin.atualizacao.cidades.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formcidades',

    title: 'Cidade',

    requires: [
        'SamosAdmin.atualizacao.cidades.form.ViewModel'
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
                                    flex: 1,
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
                                    flex: 1,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    hidden: configs.getClientName() == 'prudenmoveis',
                                    bind: {
                                        value: '{model.CIDADES_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                { // Combo prudenmoveis - add Cidades promocionais
                                    flex: false,
                                    width: 150,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.CIDADES_STATUS}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['T', 'Ativo'],
                                            ['P', 'Promocional'],
                                            ['F', 'Inativo']
                                        ]                    
                                    }
                                },
                                {
                                    flex: 6,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'estado',
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.CIDADES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    maxLength: 2,
                                    reference: 'estado',
                                    proximoFoco: 'ibge',
                                    fieldLabel: 'Estado',
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    maxLength: 8,
                                    reference: 'ibge',
                                    proximoFoco: 'ibge',
                                    fieldLabel: 'IBGE',
                                    bind: {
                                        value: '{model.CIDADES_IBGE}',
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
