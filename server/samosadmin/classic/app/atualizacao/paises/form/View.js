Ext.define('SamosAdmin.atualizacao.paises.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formpaises',

    title: 'País',

    requires: [
        'SamosAdmin.atualizacao.paises.form.ViewModel'
    ],

    rightbuttons: [
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
                                        value: '{model.PAISES_STATUS}',
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
                                    reference: 'codigopais',
                                    proximoFoco: 'nome',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Código Pais',
                                    bind: {
                                        value: '{model.PAISES_CODIGO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 7,
                                    maxLength: 50,
                                    reference: 'nome',
                                    proximoFoco: 'nome',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.PAISES_NOME}',
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
