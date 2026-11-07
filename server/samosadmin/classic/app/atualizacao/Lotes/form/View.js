Ext.define('SamosAdmin.atualizacao.lotes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formlotes',

    title: 'Lote',

    requires: [
        'SamosAdmin.atualizacao.lotes.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir'
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
                                        value: '{model.LOTES_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Produto',
                                    flex: 1,
                                    tabela: 'produtos',
                                    reference: 'produto',
                                    proximoFoco: 'lote',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRODUTOS_NOME',          'PRODUTOS_NOME'],
                                        ['LOTES_ID_PRODUTOS',      'PRODUTOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.PRODUTOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 85,
                                    fieldLabel: 'Cód Produto',
                                    reference: 'codigoproduto',
                                    bind: {
                                        value: '{model.LOTES_ID_PRODUTOS}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 160,
                                    maxLength: 13,
                                    reference: 'lote',
                                    maxLength: 20,
                                    proximoFoco: 'fabricacao',
                                    fieldLabel: 'Lote',
                                    bind: {
                                        value: '{model.LOTES_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 130,
                                    fieldLabel: 'Fabricação',
                                    reference: 'fabricacao',
                                    proximoFoco: 'validade',
                                    bind: {
                                        value: '{model.LOTES_FABRICACAO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'datefield'
                                },
                                {
                                    width: 130,
                                    fieldLabel: 'Validade',
                                    reference: 'validade',
                                    proximoFoco: 'anvisa',
                                    bind: {
                                        value: '{model.LOTES_VALIDADE}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'datefield'
                                },
                                {
                                    fieldLabel: configs.getProdutos().labelLocalizaLote || 'Cód Anvisa',
                                    flex: 1,
                                    reference: 'anvisa',
                                    maxLength: 15,
                                    proximoFoco: 'lotequantidade',
                                    bind: {
                                        value: '{model.LOTES_LOCALIZACAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: 'Quantidade',
                                    reference: 'lotequantidade',
                                    proximoFoco: 'lotevendido',
                                    fieldStyle:'color:red;',
                                    bind: {
                                        value: '{model.LOTES_SALDO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 150,
                                    fieldLabel: 'Vendido',
                                    reference: 'lotevendido',
                                    fieldStyle:'color:blue;', 
                                    ui: 'field-readonly',                                    
                                    readOnly: true,                                   
                                    bind: {
                                        value: '{model.VENDIDO_LOTES}' // Calculado - apenas para consulta
                                    }
                                }
                            ]
                        },
                        {
                            hidden: configs.getClientName() != 'malacrida',
                            items: [
                                {
                                    flex: 1,
                                    maxLength: 13,
                                    reference: 'certificado',
                                    maxLength: 100,
                                    fieldLabel: 'Certificado',
                                    bind: {
                                        value: '{model.LOTES_NOME}',
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
