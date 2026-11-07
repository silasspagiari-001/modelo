Ext.define('SamosAdmin.atualizacao.aplicacoes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formaplicacoes',

    title: 'Aplicação Analítica',

    requires: [
        'SamosAdmin.atualizacao.aplicacoes.form.ViewModel'
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
                    title: 'Aplicações Sintéticas',
                    items: [
                        {
                            xtype: 'grid',
                            flex: 1,
                            height: 200,
                            reference: 'gridselecaplicacao',
                            ui: 'panel-clean-' + tema,
                            bind: {
                                store: '{aplicacoes}'
                            },
                            selecionarPrimeiroAposBuscar: false,
                            listeners: {
                                itemclick: 'onSelecionarAplicacaoGrid'
                            },
                            columns: [
                                {
                                    text: 'Reduzido',
                                    dataIndex: 'APLICACOES_ID',
                                    width: 100,
                                    align: 'right'
                                },
                                {
                                    text: 'Máscara',
                                    dataIndex: 'APLICACOES_MASCARA',
                                    width: 100,
                                    align: 'center'
                                },
                                {
                                    text: 'Nome da Aplicação',
                                    dataIndex: 'APLICACOES_NOME',
                                    flex : 2
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Aplicação Analítica',
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
                                    bind: {
                                        value: '{model.APLICACOES_MASCARA}'
                                    },
                                    ui: 'field-readonly',
                                    readOnly: true
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
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo_aplicacaoro',
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
                                    hidden: configs.getClientName() == 'eleve',
                                    store: [
                                        ['D', 'Despesa'],
                                        ['R', 'Receita'],
                                        ['C', 'Custos'],
                                        ['U', 'Deduções']                                        
                                    ],
                                    bind: {
                                        value: '{model.APLICACOES_TIPO}'
                                    },
                                    readOnly: true
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
