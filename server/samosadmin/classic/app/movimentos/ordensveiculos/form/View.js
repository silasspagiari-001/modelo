Ext.define('SamosAdmin.movimentos.ordensveiculos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formordensveiculos',

    requires: [
        'SamosAdmin.movimentos.ordensveiculos.form.ViewModel',
        'SamosAdmin.movimentos.ordensveiculos.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir',
        'Baixar',
        'Executar',
        'Reativar',
        'Opções: Fotos'        
    ],
    
    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    title: 'OS',

    constructor: function (config) {
        const tema = configs.getTema();
        
        const osConsumidorTrigger = {
            edit: {
                cls: 'x-fa fa-edit',
                handler: 'onPessoasEditClick'
            }
        }

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
                                    proximoFoco: 'prisma',
                                    buscarPor: 'Genérica',
                                    bind: {
                                        tabela: 'pessoas',
                                        fieldLabel: 'Pessoa',
                                        value: '{model.ORDENS_NOME}',
                                        hidden: '{isOSConsumidor}',
                                        readOnly: '{readOnly}',
                                        associations: [
                                            ['ORDENS_NOME',        'PESSOAS_NOME'],
                                            ['ORDENS_ID_PESSOAS',  'PESSOAS_ID'],
                                            ['ORDENS_CPFCNPJ',     'PESSOAS_CPFCNPJ'],
                                            ['CIDADES_NOME',       'CIDADES_NOME'],
                                            ['CIDADES_ESTADO',     'CIDADES_ESTADO'],
                                            ['ORDENS_EMAIL',       'PESSOAS_EMAIL'],
                                            ['PESSOAS_TIPO',       'PESSOAS_TIPO'],
                                            ['PESSOAS_TELEFONE',   'PESSOAS_TELEFONE'],
                                            ['PESSOAS_CELULAR',    'PESSOAS_CELULAR']    
                                        ],
    
                                    },
                                    triggers: osConsumidorTrigger
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ORDENS_ID_PESSOAS}'
                                    },
                                    listeners: {
                                        change: 'onPessoasChange'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'nomepessoa',
                                    proximoFoco: 'prisma',
                                    fieldLabel: 'Pessoa',
                                    emptyText: 'Digite o nome...',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        hidden: '{!isOSConsumidor}',
                                        value: '{model.ORDENS_NOME}'
                                    },
                                    triggers: {
                                        close: {
                                            cls: 'x-fa fa-close',
                                            handler: 'onPessoasCloseClick'
                                        }
                                    }
                                },
                                {
                                    reference: 'cpfcnpj',
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'prisma',
                                    fieldLabel: 'CPF',
                                    bind: {
                                        value: '{model.ORDENS_CPFCNPJ}',
                                        ui: '{isOSConsumidor ? "textbold-' + tema + '" : "field-readonly"}',
                                        readOnly: '{readOnly || !isOSConsumidor}',
                                    }
                                },
                                {
                                    flex: false,
                                    width: 50, // 150
                                    reference: 'prisma',
                                    proximoFoco: 'placa',
                                    fieldLabel: 'Prisma',
                                    maxLength: 4,
                                    bind: {
                                        value: '{model.VEICULO_PRISMA}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 162,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'produto0',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.TIPO_OS}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['N', 'Normal'],
                                            ['R', 'Retorno'],
                                            ['G', 'Garantia'],
                                            ['O', 'Orçamento']
                                        ]
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 120,
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
                                    width: 90,
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
                                    width: 40,
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
                                    width: 47,
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
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',                                        
                                        '_____-____',
                                        '(__) ____-____',                                        
                                        '(__) _____-____'
                                    ],
                                    flex: false, 
                                    width: 165,
                                    reference: 'celular',
                                    proximoFoco: 'produto0',
                                    fieldLabel: 'Celular',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_CELULAR}',
                                        ui: '{isOSConsumidor ? "textbold-' + tema + '" : "field-readonly"}',
                                        readOnly: '{readOnly || !isOSConsumidor}',
                                    }
                                },
                                {
                                    flex: false,
                                    width: 217, // 283
                                    reference: 'log',
                                    proximoFoco: 'hora',
                                    fieldLabel: 'Log',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green;font-size:10px',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_LOG}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 120,
                                    flex: false,
                                    reference: 'faturado',
                                    proximoFoco: 'status',
                                    ui: 'field-readonly',                                    
                                    readOnly: true,
                                    bind: {
                                        fieldLabel: 'Faturado',
                                        readOnly: '{readOnly}',
                                    }
                                },
                                {
                                    width: 138,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', 'Executar' ],
                                        ['E', 'Executado'],
                                        ['F', 'Faturado']
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
                                    tabela: 'usuarios',
                                    reference: 'usuario',
                                    fieldLabel: 'Vendedor',                                    
                                    proximoFoco: 'produto0',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOME',        'USUARIOS_NOME'],
                                        ['ORDENS_ID_USUARIOS',   'USUARIOS_ID'],
                                        ['USUARIOS_CPFCNPJ',     'USUARIOS_CPFCNPJ'],
                                        ['USUARIOS_TIPO',        'USUARIOS_TIPO']
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.USUARIOS_NOME}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ORDENS_ID_USUARIOS}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Placa',
                                    reference: 'placa',
                                    proximoFoco: 'marca',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.VEICULO_PLACA}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 150,
                                    fieldLabel: 'Marca',
                                    reference: 'marca',
                                    proximoFoco: 'modelo',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.VEICULO_MARCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 150,
                                    fieldLabel: 'Modelo',
                                    reference: 'modelo',
                                    proximoFoco: 'anomodelo',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.VEICULO_MODELO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 85,
                                    fieldLabel: 'Ano/Modelo',
                                    reference: 'anomodelo',
                                    proximoFoco: 'kminicio',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.VEICULO_ANOMODELO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'Km Inicio',
                                    reference: 'kminicio',
                                    proximoFoco: 'kmfinal',
                                    maxLength: 7,
                                    bind: {
                                        value: '{model.VEICULO_KMINICIO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'Km Final',
                                    reference: 'kmfinal',
                                    proximoFoco: 'produto0',
                                    maxLength: 7,
                                    bind: {
                                        value: '{model.VEICULO_KMFINAL}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: false,
                                    width: 120,
                                    xtype: 'combobox',
                                    fieldLabel: 'Combustível',
                                    reference: 'combustivel',
                                    proximoFoco: 'produto0',
                                    forceSelection: false,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.VEICULO_COMBUSTIVEL}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['N', '-'],
                                            ['E', 'Etanol'],
                                            ['D', 'Diesel'],
                                            ['F', 'Flex'],
                                            ['G', 'Gasolina'],
                                            ['V', 'GNV']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 138,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    maxLength: 8,
                                    ui: 'field-readonly',
                                    readOnly: true,                                                                        
                                    bind: {
                                        value: '{model.ORDENS_HORAFECHAMENTO}'
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
                            layout: (configs.getClientName() == 'masterautocenter' ? 'hbox'  : 'fit'),
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    height: 118,
                                    lines: 10,
                                    lineHeight: 30,
                                    maxLength: 50,
                                    reference: 'observacoes',
                                    proximoFoco: 'numero0',
                                    hidden: configs.getClientName() == 'masterautocenter',
                                    bind: {
                                        value: '{model.ORDENS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
                                    hidden: configs.getClientName() != 'masterautocenter',
                                    fieldLabel: 'Observações Auto Center',
                                    flex: 0.5,
                                    height: 100,
                                    maxLength: 255,
                                    reference: 'observacoes',                                    
                                    bind: {                  
                                        value: '{model.OBSERVACOES_EMPRESA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
                                    hidden: configs.getClientName() != 'masterautocenter',
                                    fieldLabel: 'Observações Cliente',
                                    flex: 0.5,
                                    height: 100,
                                    maxLength: 255,
                                    reference: 'observacoescli',                                    
                                    bind: {                  
                                        value: '{model.OBSERVACOES_CLIENTE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
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
                                            width: 100,
                                            fieldLabel: 'Produtos',
                                            reference: 'produtos',
                                            xtype: 'samoswidgets-textmoney',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.ORDENS_PRODUTOS}',
                                            }
                                        },
                                        {
                                            flex: false,
                                            width: 50,
                                            fieldLabel: 'Qtde',
                                            reference: 'qtde',
                                            ui: 'field-readonly',
                                            fieldStyle: 'text-align:right;',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.CONTAGEM_ITENSPRODUTOS}',
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 100,
                                            fieldLabel: 'Serviços',
                                            reference: 'servicos',
                                            xtype: 'samoswidgets-textmoney',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.ORDENS_SERVICOS}',
                                            }
                                        },
                                        {
                                            flex: false,
                                            width: 50,
                                            fieldLabel: 'Qtde',
                                            reference: 'qtde',
                                            ui: 'field-readonly',
                                            fieldStyle: 'text-align:right;',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.CONTAGEM_ITENSSERVICOS}',
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
                                            width: 60,
                                            fieldLabel: '% Desc',
                                            reference: 'descper',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.DESCONTO_PERCENTUAL}'
                                            },
                                            listeners: {
                                                change: 'calcularDescontoPercentual'
                                            }
                                        },
                                        {
                                            flex: false,
                                            width: 90,
                                            fieldLabel: 'R$ Desconto',
                                            reference: 'descvlr',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_DESCONTOS}'
                                            },
                                            listeners: {
                                                change: 'calcularDescontoDinheiro'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 154,
                                            fieldLabel: 'R$ Total',
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
                                    proximoFoco: 'qtde',
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
                                        ['ORDENSPRODUTOS_CUSTO',       'SALDOS_PRECO'],
                                        ['ORDENSPRODUTOS_PRECO',       'SALDOS_PRECO'],
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
                                    title: 'Mecânico',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'servico',
                                    naoSairSeVazio: false,                                    
                                    permitirApenasNumeros: false,
                                    buscarPor: 'Genérica',
                                    name: 'USUARIOS_NOME',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['USUARIOS_NOME',             'USUARIOS_NOME'],
                                        ['ORDENSSERVICOS_ID_USUARIOS', 'USUARIOS_ID']
                                    ]
                                },
                                { hidden: true, name: 'ORDENSSERVICOS_ID_USUARIOS' },
                                {
                                    title: 'Serviço',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'servicos',
                                    proximoFoco: 'qtde',
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
                                    proximoFoco: 'servico[linhadebaixo]',
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
