Ext.define('SamosAdmin.processos.entradas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formprocessosentradas',

    title: 'Ajuste entrada produto',

    requires: [
        'SamosAdmin.processos.entradas.form.ViewModel',
        'SamosAdmin.processos.entradas.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function (config) {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 100,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    bind: {
                                        value: '{model.MOVIMENTOS_NUMERO}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'Série',
                                    reference: 'serie',
                                    bind: {
                                        value: '{model.MOVIMENTOS_SERIE}'
                                    },
                                    ui: 'field-readonly',
                                    readOnly: true
                                },
                                {
                                    xtype: 'datefield',
                                    width: 100,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_EMISSAO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 100,
                                    flex: false,
                                    fieldLabel: 'Entrada/Saída',
                                    reference: 'entrada',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ENTRADASAIDA}'
                                    }
                                },  
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'Operação',
                                    reference: 'operacao',
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ID_OPERACOES}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Pessoa',
                                    reference: 'pessoa',
                                    bind: {
                                        value: '{model.MOVIMENTOS_NOME}'
                                    },
                                    ui: 'field-readonly',
                                    readOnly: true
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 100,
                                    xtype: 'numberfield',                                    
                                    fieldLabel: 'Quantidade',
                                    reference: 'quantidade',
                                    fieldStyle: 'text-align:right;',                                    
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    decimalPrecision: 3,
                                    hideTrigger: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_QUANTIDADE}',
                                        readOnly: '{readOnly || isSaida}'                                        
                                    },
                                },
                                {
                                    xtype: 'samoswidgets-textsearch', 
                                    fieldLabel: 'Produto',
                                    flex: 1,
                                    tabela: 'produtos',
                                    reference: 'produto',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRODUTOS_NOME',          'PRODUTOS_NOME'],
                                        ['MOVIMENTOSITENS_ID_PRODUTOS', 'PRODUTOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.PRODUTOS_NOME}',
                                        readOnly: '{readOnly || isSaida}'
                                    }
                                },
                                {
                                    fieldLabel: 'Código',
                                    flex: false,
                                    width: 100,
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOSITENS_ID_PRODUTOS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch', 
                                    fieldLabel: 'Lote',
                                    flex: 1,
                                    tabela: 'lotes',
                                    reference: 'lote',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['LOTES_REFERENCIA',          'LOTES_REFERENCIA'],
                                        ['LOTES_FABRICACAO',          'LOTES_FABRICACAO'],
                                        ['LOTES_VALIDADE',            'LOTES_VALIDADE'],
                                        ['LOTES_ID_PRODUTOS',         'LOTES_ID_PRODUTOS'],
                                        ['MOVIMENTOSITENS_ID_LOTES',  'LOTES_ID']
                                    ],
                                    bind: {
                                        hidden: '{isSemLote}',
                                        value: '{model.LOTES_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 100,
                                    flex: false,
                                    fieldLabel: 'Fabricação',
                                    reference: 'fabricacao',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isSemLote}',                                        
                                        value: '{model.LOTES_FABRICACAO}'
                                    }
                                },  
                                {
                                    xtype: 'datefield',
                                    width: 100,
                                    flex: false,
                                    fieldLabel: 'Validade',
                                    reference: 'validade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isSemLote}',                                        
                                        value: '{model.LOTES_VALIDADE}'
                                    }
                                },  
                                {
                                    fieldLabel: 'Cód Lote',
                                    flex: false,
                                    width: 100,
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true,
                                    bind: {
                                        hidden: '{isSemLote}',                                        
                                        value: '{model.MOVIMENTOSITENS_ID_LOTES}'
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
