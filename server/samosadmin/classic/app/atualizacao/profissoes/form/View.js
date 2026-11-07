Ext.define('SamosAdmin.atualizacao.profissoes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formprofissoes',

    title: 'Profissão',

    requires: [
        'SamosAdmin.atualizacao.profissoes.form.ViewModel'
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
                                    bind: {
                                        value: '{model.PROFISSOES_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 8,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'nome',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.PROFISSOES_NOME}',
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
