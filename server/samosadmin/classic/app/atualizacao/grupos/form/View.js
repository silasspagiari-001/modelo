Ext.define('SamosAdmin.atualizacao.grupos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formgrupos',

    title: 'Grupo',

    requires: [
        'SamosAdmin.atualizacao.grupos.form.ViewModel'
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
                                    width: 100,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.GRUPOS_STATUS}',
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
                                    proximoFoco: configs.getClientName() == 'prudenmoveis' ? 'margem' : 'nome',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.GRUPOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            hidden: configs.getClientName() != 'prudenmoveis',
                            items: [
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: '% MarkUp',
                                    reference: 'margem',
                                    proximoFoco: 'margemmin',
                                    bind: {
                                        value: '{model.PERCENTUAL_MARGEM}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: '% Margem Mínima',
                                    reference: 'margemmin',
                                    proximoFoco: 'perprazo',
                                    bind: {
                                        value: '{model.PERCENTUAL_MARGEMMINIMA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: '% a Prazo',
                                    reference: 'perprazo',
                                    proximoFoco: 'comissao',
                                    bind: {
                                        value: '{model.PERCENTUAL_PRAZO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: '% Comissão',
                                    reference: 'comissao',
                                    bind: {
                                        value: '{model.PERCENTUAL_COMISSAO}',
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
