Ext.define('SamosAdmin.movimentos.ordensturbos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formordensturbos',

    requires: [
        'SamosAdmin.movimentos.ordensturbos.form.ViewModel',
        'SamosAdmin.movimentos.ordensturbos.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir: Ordem, Espelho, Garantia', 
        'Opções: Finalizar, Reativar'
    ],
    
    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    title: 'OS',

    constructor: function () {
        const tema = configs.getTema();

        SamosUtils.Utils.adicionarBotaoImpressao({
            btnName   : 'Serviços',
            showLayout: true,
            index     : 4,
            visualizar: false,
            view      : this
        });
        
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
                                    proximoFoco: 'produtoacabado',
                                    buscarPor: 'Genérica',
                                    bind: {
                                        tabela: 'pessoas',
                                        fieldLabel: 'Pessoa',
                                        value: '{model.ORDENS_NOME}',
                                        readOnly: '{readOnly}',
                                        associations: [
                                            ['ORDENS_NOME',        'PESSOAS_NOME'],
                                            ['ORDENS_ID_PESSOAS',  'PESSOAS_ID'],
                                            ['ORDENS_CPFCNPJ',     'PESSOAS_CPFCNPJ'],
                                            ['CIDADES_NOME',       'CIDADES_NOME'],
                                            ['CIDADES_ESTADO',     'CIDADES_ESTADO'],
                                            ['ORDENS_EMAIL',       'PESSOAS_EMAIL'],
                                            ['PESSOAS_ID',         'PESSOAS_ID'],
                                            ['PESSOAS_TELEFONE',   'PESSOAS_TELEFONE'],
                                            ['PESSOAS_CELULAR',    'PESSOAS_CELULAR']    
                                        ]
                                    },
                                    callbackFn: 'aposBuscarPessoa'                                    
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ORDENS_ID_PESSOAS}'
                                    }
                                },
                                {
                                    reference: 'cpfcnpj',
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'email',
                                    fieldLabel: 'CPF',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_CPFCNPJ}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 150,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'email',                                    
                                    bind: {
                                        value: '{model.ORDENS_EMISSAO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 150,
                                    reference: 'referencia',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Referência',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_REFERENCIA}'
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
                                    width: 60,
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
                                    bind: {
                                        proximoFoco: 'produto0',
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENS_EMAIL}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',                                        
                                        '_____-____',
                                        '(__) _____-____'
                                    ],
                                    flex: false,
                                    width: 150,
                                    reference: 'celular',
                                    proximoFoco: 'produto0',
                                    fieldLabel: 'Celular',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 150,
                                    flex: false,
                                    reference: 'faturado',
                                    proximoFoco: 'status',
                                    ui: 'field-readonly',                                    
                                    readOnly: true,
                                    bind: {
                                        fieldLabel: 'Faturado',
                                        value: '{model.ORDENS_REABERTURA}'
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
                                        ['N', 'Aberta' ],
                                        ['E', 'Finalizada'],
                                        ['F', 'Faturada']
                                    ],
                                    bind: {
                                        fieldStyle: '{isExecutado ? "color:blue" : isFaturado ? "color:black" : "color:green"}',
                                        value: '{model.ORDENS_STATUS}'
                                    }
                                }                                
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    reference: 'produtoacabado',
                                    fieldLabel: 'Produto Acabado',
                                    proximoFoco: 'modelo',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['ORDENS_DESCRICAO',      'PRODUTOS_NOME'],
                                        ['ORDENS_IDSKY',          'PRODUTOS_ID'],
                                        ['ORDENS_GEOLOCALIZACAO', 'PRODUTOS_APLICACAO'],
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.ORDENS_DESCRICAO}'
                                    },
                                    listeners: {
                                        blur: 'onSairCampoProdutoAcabado'
                                    }
                                },
                                {
                                    fieldLabel: 'Código',
                                    flex: false,
                                    width: 100,
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right;color:blue;',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_IDSKY}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 305, 
                                    reference: 'log',
                                    proximoFoco: 'hora',
                                    fieldLabel: 'Log',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_LOG}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 160,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    maxLength: 8,
                                    ui: 'field-readonly',
                                    readOnly: true,                                                                        
                                    bind: {
                                        value: '{model.ORDENS_HORAEMISSAO}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'textfield',                                    
                                    reference: 'modelo',
                                    fieldLabel: 'Modelo',                                    
                                    proximoFoco: 'aplicacao',
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.ORDENS_IDENTIFICACAO}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'textfield',                                    
                                    reference: 'aplicacao',
                                    fieldLabel: 'Aplicação', 
                                    proximoFoco: 'contato',
                                    maxLength: 25,
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.ORDENS_GEOLOCALIZACAO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'textfield',                                    
                                    reference: 'contato',
                                    fieldLabel: 'Contato', 
                                    proximoFoco: 'produto0',
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.ORDENS_CONTATOS}'
                                    }
                                },
                                {
                                    width: 90,
                                    flex: false,
                                    fieldLabel: 'Tipo',
                                    reference: 'garantia',
                                    bind: {
                                        value: '{model.ORDENS_AGENDAMENTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Garantia',
                                    checked: false
                                },
                                {
                                    width: 60,
                                    flex: false,
                                    fieldLabel: 'Origem',
                                    reference: 'empresaorigem',
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_ID_EMPRESAORIGEM}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 95,
                                    fieldLabel: 'Número',                                    
                                    reference: 'numeroorigem',
                                    proximoFoco: 'serieorigem',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        readOnly: true,
                                        ui: 'field-readonly',
                                        value: '{model.ORDENS_NUMEROORIGEM}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 60,
                                    reference: 'serieorigem',
                                    fieldLabel: 'Série',
                                    bind: {
                                        readOnly: true,
                                        ui: 'field-readonly',
                                        value: '{model.ORDENS_SERIEORIGEM}'
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
// bloco da obs e totais
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
                                    proximoFoco: 'numero0',
                                    bind: {
                                        value: '{model.ORDENS_OBSERVACOES}',
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
                            width: 190,
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            items: [
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 170, // 100
                                            fieldLabel: 'Produtos',
                                            reference: 'totalprodutos',
                                            xtype: 'samoswidgets-textmoney',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.ORDENS_PRODUTOS}',
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 170,
                                            fieldLabel: 'Serviços',
                                            reference: 'totalservicos',
                                            xtype: 'samoswidgets-textmoney',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.ORDENS_SERVICOS}',
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            height: 118,
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',  // 10 0 10 10 all
                            padding: '10 0 10 10',                            
                            width: 190,
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            items: [
                                {
                                    items: [
                                        {
                                            flex: false,
                                            margin: '25 0 0 5',
                                            padding: '25 0 0 5',
                                            width: 154,
                                            fieldLabel: 'Total',
                                            reference: 'total_ordemservico',
                                            xtype: 'samoswidgets-textmoney',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            fieldStyle: 'color:blue',
                                            bind: {
                                                value: '{model.ORDENS_TOTAL}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Produtos',
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: true,
                            name: 'ORDENS_PRODUTOSITENS',
                            idProperty: 'ORDENSPRODUTOS_ID',
                            descartarSeVazio: 'ORDENSPRODUTOS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            listeners: {
                                antesDePublicarModel: 'calcularProduto',
                                aposPublicarModel: 'fazerSomasERateios'
                            },
                            fields: [
                                { hidden: true, name: 'ORDENSPRODUTOS_ID' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    proximoFoco: 'qtdeproduto',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararProduto',
                                    name: 'ORDENSPRODUTOS_ID_PRODUTOS',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['ORDENSPRODUTOS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',              'PRODUTOS_NOME'],
                                        ['ORDENSPRODUTOS_CUSTO',       'SALDOS_CUSTO'],
//                                      ['ORDENSPRODUTOS_PRECO',       'SALDOS_PRECO'],
                                        ['SALDOS_PRECO',               'SALDOS_PRECO']
                                    ]
                                },
                                {
                                    title: 'Descrição Produto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    readOnly: true
                                },
                                {
                                    name: 'ORDENSPRODUTOS_QUANTIDADE',
                                    title: 'Qtde',
                                    reference: 'qtdeproduto',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    width: 60,                                                                            
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: '0.001',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {    
                                        readOnly: '{readOnly}',
                                        clicarNoProximoFoco: '{!permitidoAlterarPreco}',
                                        proximoFoco: `{
                                            permitidoAlterarPreco ? 
                                            "precoproduto" : 
                                            "produto[linhadebaixo]"
                                        }`
                                    }
                                },
                                {
                                    title: 'Preço',
                                    name: 'ORDENSPRODUTOS_PRECO',
                                    reference: 'precoproduto',                                    
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly || !permitidoAlterarPreco}'
                                    }
                                },
                                {
                                    title: 'Total',
                                    reference: 'totalproduto',
                                    name: 'ORDENSPRODUTOS_TOTAL',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    readOnly: true
                                },
                                { hidden: true, name: 'SALDOS_PRECO' },
                                { hidden: true, name: 'ORDENSPRODUTOS_ID_ORDENS' },
                                { hidden: true, name: 'ORDENSPRODUTOS_ID_OPERACOES' },
                                { hidden: true, name: 'ORDENSPRODUTOS_CUSTO' },
                                { hidden: true, name: 'ORDENSPRODUTOS_PERCENTUAL' },
                                { hidden: true, name: 'ORDENSPRODUTOS_DESCONTOS' }
                            ]
                        }
                    ]
                },
                {
                    title: 'Serviços',
                    hidden: true,
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'servicos',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: true,
                            name: 'ORDENS_SERVICOSITENS',
                            idProperty: 'ORDENSSERVICOS_ID',
                            descartarSeVazio: 'ORDENSSERVICOS_ID_SERVICOS',
                            bind: {
                                store: '{servicos}'
                            },
                            listeners: {
                                antesDePublicarModel: 'calcularServico',
                                aposPublicarModel: 'fazerSomasERateios'
                            },
                            fields: [
                                { hidden: true, name: 'ORDENSSERVICOS_ID' },
                                {
                                    title: 'Serviço',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'servicos',
                                    proximoFoco: 'qtdeservico',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararServico',
                                    name: 'ORDENSSERVICOS_ID_SERVICOS',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['ORDENSSERVICOS_ID_SERVICOS', 'SERVICOS_ID'],
                                        ['SERVICOS_NOME',              'SERVICOS_NOME'],
                                        ['ORDENSSERVICOS_PRECO',       'SERVICOS_PRECO'],
                                        ['SERVICOS_PRECO',             'SERVICOS_PRECO'],
                                        ['ORDENSSERVICOS_ISS',         'SERVICOS_ISS']
                                    ]
                                },
                                {
                                    title: 'Descrição Serviço',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'SERVICOS_NOME',
                                    readOnly: true
                                },
                                {
                                    name: 'ORDENSSERVICOS_QUANTIDADE',
                                    reference: 'qtdeservico',
                                    title: 'Qtde',                                                                            
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    width: 60,                                                                            
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: '0.001',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {    
                                        readOnly: '{readOnly}',
                                        proximoFoco: `{
                                            permitidoAlterarPreco ? 
                                            "precoservico" : 
                                            "servico[linhadebaixo]"
                                        }`
                                    }
                                },
                                {
                                    title: 'Preço',
                                    name: 'ORDENSSERVICOS_PRECO',
                                    reference: 'precoservico',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'servico[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly || !permitidoAlterarPreco}'                                        
                                    }
                                },
                                {
                                    title: 'Total',
                                    name: 'ORDENSSERVICOS_TOTAL',
                                    reference: 'totalservico',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'servico[linhadebaixo]',
                                    readOnly: true
                                },
                                { hidden: true, name: 'SERVICOS_PRECO' },
                                { hidden: true, name: 'ORDENSSERVICOS_ID_ORDENS' },
                                { hidden: true, name: 'ORDENSSERVICOS_DESCRITIVO' },
                                { hidden: true, name: 'ORDENSSERVICOS_PERCENTUAL' },
                                { hidden: true, name: 'ORDENSSERVICOS_DESCONTOS' },
                                { hidden: true, name: 'ORDENSSERVICOS_ISS' },
                                { hidden: true, name: 'ORDENSSERVICOS_BASEISS' },
                                { hidden: true, name: 'ORDENSSERVICOS_VALORISS' },
                                { hidden: true, name: 'ORDENSSERVICOS_IRRF' },
                                { hidden: true, name: 'ORDENSSERVICOS_BASEIRRF' },
                                { hidden: true, name: 'ORDENSSERVICOS_VALORIRRF' },
                                { hidden: true, name: 'ORDENSSERVICOS_DESPESAS' }
                            ]
                        }
                    ]
                }
            ]
        });
        
        this.callParent(arguments);
    }
});
