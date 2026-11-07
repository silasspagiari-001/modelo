Ext.define('SamosAdmin.movimentos.encomendas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formencomendas',

    requires: [
        'SamosAdmin.movimentos.encomendas.form.ViewModel',
        'SamosAdmin.movimentos.encomendas.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir'
    ],

    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    title: 'Encomenda',

    constructor: function (config) {
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    reference: 'pessoa',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    tabela: 'pessoas',
                                    fieldLabel: 'Pessoa',
                                    callbackFn: 'aposBuscarPessoa',
                                    associations: [
                                        ['MOVIMENTOS_NOME',       'PESSOAS_NOME'],
                                        ['MOVIMENTOS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['MOVIMENTOS_CPFCNPJ',    'PESSOAS_CPFCNPJ'],
                                        ['CIDADES_NOME',          'CIDADES_NOME'],
                                        ['CIDADES_ESTADO',        'CIDADES_ESTADO'],
                                        ['MOVIMENTOS_EMAIL',      'PESSOAS_EMAIL'],
                                        ['PESSOAS_TELEFONE',      'PESSOAS_TELEFONE'],
                                        ['MOVIMENTOS_CELULAR',    'PESSOAS_CELULAR']
                                    ],
                                    bind: {
                                        value: '{model.MOVIMENTOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_PESSOAS}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    reference: 'cpfcnpj',
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'email',
                                    fieldLabel: 'CPF',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_CPFCNPJ}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) ____-____',
                                    flex: false,
                                    width: 150,
                                    reference: 'telefone',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Telefone',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_TELEFONE}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 150,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'email',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOS_EMISSAO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 95,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'serie',
                                    fieldStyle:'text-align:right;color:red;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 60,
                                    fieldLabel: 'Série',
                                    reference: 'serie',
                                    proximoFoco: 'email',
                                    fieldStyle:'color:red',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{modelSerie}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    reference: 'cidade',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Cidade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 80,
                                    reference: 'estado',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Estado',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'email',
                                    fieldLabel: 'Email',
                                    flex: false,
                                    width: 295,
                                    proximoFoco: 'produto0',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MOVIMENTOS_EMAIL}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    flex: false,
                                    width: 150,
                                    reference: 'celular',
                                    proximoFoco: 'produto0',
                                    fieldLabel: 'Celular',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 150,
                                    flex: false,
                                    reference: 'faturado',
                                    proximoFoco: 'atualiza',
                                    fieldLabel: 'Faturado',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOS_ENTRADASAIDA}'
                                    }
                                },                                
                                {
                                    width: 160,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', 'Não Faturado'],
                                        ['F', 'Faturado']
                                    ],
                                    fieldStyle: 'color:green',
                                    bind: {
                                        value: '{model.MOVIMENTOS_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    reference: 'vendedor',
                                    proximoFoco: 'rsdescontos',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    callbackFn: 'updateLog',
                                    fieldLabel: 'Usuário',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    associations: [
                                        ['USUARIOS_NOME',           'USUARIOS_NOME'],
                                        ['MOVIMENTOS_ID_USUARIOS',  'USUARIOS_ID'],
                                        ['USUARIOS_LOGIN',          'USUARIOS_LOGIN']
                                    ],
                                    bind: {
                                        value: '{model.USUARIOS_NOME}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_USUARIOS}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_LOGIN}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'log',
                                    proximoFoco: 'rsdescontos',
                                    fieldLabel: 'Log',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_LOG}'
                                    }
                                },
                                {
                                    flex: false,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    proximoFoco: 'numeroorigem',
                                    maxLength: 8,
                                    width: 160,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOS_HORA}'
                                    }
                                }                           
                            ]
                        }
                    ]
                },
                {
                    layout: 'hbox',
                    height: '0',
                    xtype: 'component',
                    padding: '0',
                    ui: 'default',
                    listeners: {},
                    bind: {
                        html: '{marcaDaguaText}',
                        style: '{marcaDaguaStyle}'
                    }
                },
                {
                    title: 'Observações',
                    ui: 'formpanel-noheader-' + tema,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10',
                            height: 118,
                            flex: 1,
                            layout: 'fit',
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    height: 118,
                                    lines: 10,
                                    lineHeight: 30,
                                    maxLength: 50,
                                    reference: 'observacoes',
                                    proximoFoco: 'rsdescontos',
                                    bind: {
                                        value: '{model.MOVIMENTOS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10 0 10 10',
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            width: 140,
                            items: [
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 120,
                                            fieldLabel: 'Produtos',
                                            reference: 'produtos_valor',
                                            proximoFoco: 'seguro',
                                            xtype: 'samoswidgets-textmoney',
                                            fieldStyle: 'color:green',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.MOVIMENTOS_PRODUTOS}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 120,
                                            fieldLabel: 'Total',
                                            reference: 'total',
                                            xtype: 'samoswidgets-textmoney',
                                            fieldStyle: 'color:blue',
                                            proximoFoco: 'produto0',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.MOVIMENTOS_TOTAL}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'MOVIMENTOS_ITENS',
                            idProperty: 'MOVIMENTOSITENS_ID',
                            descartarSeVazio: 'MOVIMENTOSITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            listeners: {
                                antesDePublicarModel: 'calcularProduto',
                                aposPublicarModel: 'fazerSomasERateios'
                            },
                            fields: [
                                { hidden: true, name: 'MOVIMENTOSITENS_ID' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    proximoFoco: 'movimentositensquantidade',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararProduto',
                                    valueStatus: 4,
                                    name: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['MOVIMENTOSITENS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',               'PRODUTOS_NOME'],
                                        ['PRODUTOS_MARCA',              'PRODUTOS_MARCA'],
                                        ['PRODUTOS_APLICACAO',          'PRODUTOS_APLICACAO'],
                                        ['SALDOS_PRAZO',                'SALDOS_PRAZO'],
                                        ['SALDOS_PRECO',                'SALDOS_PRECO'],
                                        ['SALDOS_DISPONIVEL',           'SALDOS_DISPONIVEL']
                                    ]
                                },
                                {
                                    title: 'Nome do Produto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    readOnly: true
                                },
                                {
                                    title: configs.getProdutos().labelMarca,
                                    width: 110,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_MARCA',
                                    readOnly: true
                                },
                                {
                                    title: configs.getProdutos().labelAplicacao,
                                    width: 110,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_APLICACAO',
                                    readOnly: true
                                },
                                {
                                    name: 'MOVIMENTOSITENS_QUANTIDADE',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: '0.001',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    title: 'Qtde',                                                                            
                                    width: 60,                                                                            
                                    proximoFoco: 'produto[linhadebaixo]',
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true,
                                    name: 'MOVIMENTOSITENS_PRECO',
                                    width: 85,
                                    xtype: 'samoswidgets-textmoney',
                                    title: 'Preço',
                                    readOnly: true
                                },
                                {
                                    title: 'Total',
                                    name: 'MOVIMENTOSITENS_TOTAL',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    readOnly: true
                                },
                                { hidden: true, name: 'SALDOS_PRAZO' },
                                { hidden: true, name: 'SALDOS_PRECO' }
                            ]
                        }
                    ]
                }
            ]
        });
        
        this.callParent(arguments);
    }
});
