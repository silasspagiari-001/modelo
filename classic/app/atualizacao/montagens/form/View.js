Ext.define('SamosAdmin.atualizacao.montagens.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formmontagens',

    title: 'Montagem',

    requires: [
        'SamosAdmin.atualizacao.montagens.form.ViewModel'
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
                                        value: '{model.MONTAGENS_STATUS}',
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
                                    proximoFoco: configs.getClientName() == 'prudenmoveis' ? 'precoa' : 'preco',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.MONTAGENS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Preço',
                                    reference: 'preco',
                                    proximoFoco: 'precoa',
                                    hidden: configs.getClientName() == 'prudenmoveis',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.MONTAGENS_VALOR}',
                                        readOnly: '{readOnly}',
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Preços',
                    hidden: configs.getClientName() != 'prudenmoveis',
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Tabela A',
                                    reference: 'precoa',
                                    proximoFoco: 'precob',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.VALOR_MONTAGEMA}',
                                        readOnly: '{readOnly}',
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Tabela B',
                                    reference: 'precob',
                                    proximoFoco: 'precoc',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.VALOR_MONTAGEMB}',
                                        readOnly: '{readOnly}',
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Tabela C',
                                    reference: 'precoc',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.VALOR_MONTAGEMC}',
                                        readOnly: '{readOnly}',
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
