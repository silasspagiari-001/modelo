Ext.define('SamosAdmin.atualizacao.convenios.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formconvenios',

    title: 'Convênio',

    requires: [
        'SamosAdmin.atualizacao.convenios.form.ViewModel'
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
                    title: 'Dados Básicos',
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 100,
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
                                        value: '{model.CONVENIOS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    width: 110,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo_convenio',
                                    proximoFoco: 'letraconvenio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['L', 'Local'],
                                        ['O', 'Região 1'],
                                        ['A', 'Região 2']
                                    ],
                                    bind: {
                                        value: '{model.CONVENIOS_TIPO}',
                                        readOnly: '{readOnly}'                                        
                                    }
                                },
                                {
                                    width: 40,
                                    maxLength: 2,
                                    reference: 'sigla',
                                    proximoFoco: 'nome',
                                    fieldLabel: 'Sigla',
                                    bind: {
                                        value: '{model.CONVENIOS_SIGLA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    maxLength: 256,
                                    reference: 'nome',
                                    fieldLabel: 'Descrição do convênio',
                                    bind: {
                                        value: '{model.CONVENIOS_NOME}',
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
