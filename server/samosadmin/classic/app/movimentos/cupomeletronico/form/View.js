Ext.define('SamosAdmin.movimentos.cupomeletronico.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formcupomeletronico',

    requires: [
        'SamosAdmin.movimentos.cupomeletronico.form.ViewModel',
        'SamosAdmin.movimentos.cupomeletronico.form.ViewController',
        'SamosAdmin.movimentos.cupomeletronico.form.recuperacao.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Caixa',
        'Pagamento',
        'Liberar',
        'Importar: De Orçamento, De Requisição, De Pedido',
        'Sefaz: Visualizar, Emitir, Reemitir, Cancelamento, Email',
        'Opções: Alterar Emissão, Alterar Vendedor'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function (config) {
        const tema = configs.getTema();

        Ext.apply(this, {
            title: 'Cupom',
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
                                    bind: {
                                        value: '{model.MOVIMENTOS_NOME}',
                                        hidden: '{isVendaConsumidor}',
                                        readOnly: '{readOnly}'
                                    },
                                    callbackFn: 'aposBuscarPessoa',
                                    triggers: {
                                        edit: {
                                            cls: 'x-fa fa-edit',
                                            handler: 'onPessoasEditClick'
                                        }
                                    },
                                    associations: [
                                        ['MOVIMENTOS_NOME',       'PESSOAS_NOME'],
                                        ['MOVIMENTOS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['MOVIMENTOS_CPFCNPJ',    'PESSOAS_CPFCNPJ'],
                                        ['PESSOAS_CPFCNPJ',       'PESSOAS_CPFCNPJ'],                        
                                        ['CIDADES_NOME',          'CIDADES_NOME'],
                                        ['CIDADES_ESTADO',        'CIDADES_ESTADO'],
                                        ['PESSOAS_FANTASIA',      'PESSOAS_FANTASIA'],
                                        ['MOVIMENTOS_EMAIL',      'PESSOAS_EMAIL'],
                                        ['PESSOAS_TELEFONE',      'PESSOAS_TELEFONE'],
                                        ['MOVIMENTOS_CELULAR',    'PESSOAS_CELULAR'],
                                        ['PESSOAS_ENDERECO',      'PESSOAS_ENDERECO'],
                                        ['PESSOAS_NUMERO',        'PESSOAS_NUMERO'],
                                        ['PESSOAS_BAIRRO',        'PESSOAS_BAIRRO'],
                                        ['PESSOAS_CEP',           'PESSOAS_CEP'],
                                        ['PESSOAS_ID_CIDADES',    'PESSOAS_ID_CIDADES'],
                                        ['PESSOAS_CREDITO',       'PESSOAS_CREDITO'],
                                        ['PESSOAS_STATUS',        'PESSOAS_STATUS'],
                                        ['PESSOAS_TIPO',          'PESSOAS_TIPO'],
                                        ['PESSOAS_INSCRICAO',     'PESSOAS_INSCRICAO'],
                                        ['PESSOAS_ID_USUARIOS',   'PESSOAS_ID_USUARIOS'],
                                        ['USUARIOS_NOMEVENDEDOR', 'USUARIOS_NOMEVENDEDOR']
                                    ]
                                },
                                {
                                    flex: 1,
                                    reference: 'nomepessoa',
                                    proximoFoco: 'cpfcnpj',
                                    fieldLabel: 'Pessoa',
                                    emptyText: 'Digite o nome...',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        hidden: '{!isVendaConsumidor}',
                                        value: '{model.MOVIMENTOS_NOME}'
                                    },
                                    triggers: {
                                        close: {
                                            cls: 'x-fa fa-close',
                                            handler: 'onPessoasCloseClick'
                                        }
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    reference: 'cpfcnpj',
                                    width: 165,
                                    proximoFoco: 'email',
                                    fieldLabel: 'CPF',
                                    bind: {
                                        ui: '{isVendaConsumidor ? "textbold-' + tema + '" : "field-readonly"}',
                                        readOnly: '{readOnly || !isVendaConsumidor}',
                                        value: '{model.MOVIMENTOS_CPFCNPJ}'
                                    },
                                    listeners: {
                                        change: 'changeCpfCnpj',
                                        keydown: 'validateCpf'
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
                                    width: 150,
                                    reference: 'celular',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Celular',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 130,
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
                                    reference: 'endereco',
                                    proximoFoco: 'email',
                                    fieldLabel: 'Endereço',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_ENDERECO}'
                                    }
                                },
                                {
                                    width: 120,
                                    maxLength: 10,
                                    reference: 'numeroendereco',
                                    proximoFoco: 'cidade',
                                    fieldLabel: 'Número',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_NUMERO}'
                                    }
                                },
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
                                    width: 45,
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
                                    xtype: 'datefield',
                                    width: 130,
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
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', 'Não Faturado'],
                                        ['M', 'Não Faturado'],
                                        ['F', 'Faturado'],
                                        ['E', 'Faturado'],
                                        ['C', 'Cancelado'],
                                        ['B', 'Cancelado']
                                    ],
                                    bind: {
                                        fieldStyle: '{isCancelado ? "color:red" : "color:green"}',
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
                                    fieldLabel: 'Vendedor',
                                    associations: [
                                        ['USUARIOS_NOME',           'USUARIOS_NOME'],
                                        ['MOVIMENTOS_ID_USUARIOS',  'USUARIOS_ID'],
                                        ['USUARIOS_LOGIN',          'USUARIOS_LOGIN']
                                    ],
                                    bind: {
                                        readOnly: (configs.getMovimentos().editaVendedor || configs.getUsuario().tipo != configs.getUsuarios().tipoVendedor) ? '{readOnly}' : true,
                                        ui: (configs.getMovimentos().editaVendedor || configs.getUsuario().privilegiado) ? 'textbold-' + tema : 'field-readonly',
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
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_PROTOCOLO}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'email',
                                    fieldLabel: 'Email',
                                    flex: 1,
                                    proximoFoco: 'celular',
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
                                    hidden: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_PRAZOS}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    proximoFoco: 'numeroorigem',
                                    maxLength: 8,
                                    width: 75,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOS_HORA}'
                                    }
                                },
                                {
                                    width: 55,
                                    fieldLabel: 'Origem',
                                    reference: 'empresaorigem',
                                    proximoFoco: 'rsdescontos',
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_ID_EMPRESAORIGEM}'
                                    }
                                },
                                {
                                    width: 65,
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
                                    fieldLabel: 'Número',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOS_NUMEROORIGEM}'
                                    }
                                },
                                {
                                    width: 40,
                                    reference: 'serieorigem',
                                    fieldLabel: 'Série',
                                    proximoFoco: 'rsdescontos',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MOVIMENTOS_SERIEORIGEM}'
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
                            //padding: '10',
                            padding: '10 0 10 10',
                            height: 118,
                            //width: 380,
                            //Calcula o width dinamicamente com base nos tamanhos dos outros campos
                            width: window.innerWidth - (380 + 120 + 120 + 390),
                            layout: 'fit',
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    //width: 380,
                                    //Calcula o width dinamicamente com base nos tamanhos dos outros campos
                                    //width: window.innerWidth - (380 + (110 * 2) + 400),
                                    flex: 1,
                                    height: 118,
                                    lines: 9,
                                    lineHeight: 30,
                                    maxLength: 60,
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
                            width: 400,
                            layout: 'vbox',
                            items: [
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    width: 380,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            flex: 1,
                                            fieldLabel: 'Chave Sat',
                                            reference: 'chavesat',
                                            proximoFoco: 'protocolo',
                                            bind: {
                                                value: '{model.MOVIMENTOS_NFE}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    width: 380,
                                    items: [
                                        {
                                            xtype: 'textfield',
                                            width: 140,
                                            fieldLabel: 'Protocolo',
                                            reference: 'protocolo',
                                            proximoFoco: 'rsdescontos',
                                            bind: {
                                                value: '{model.MOVIMENTOS_PROTOCOLO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'textfield',
                                            flex: 1,
                                            fieldLabel: 'Log',
                                            reference: 'log',
                                            proximoFoco: 'rsdescontos',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            fieldStyle:'color:green;font-size:12px',
                                            listeners: {
                                                //Atualiza manualmente o LOG pois o data binding bugou
                                                added: function(campo, evento){
                                                    const formAdded = Ext.$('formcupomeletronico')[0];
                                                    const modelAdded = formAdded.model;
                                                    
                                                    formAdded.getController().atualizarLog(modelAdded);
                                                }
                                            }
                                        },
                                        /*
                                        {
                                            width: 150,                                      
                                            reference: 'log',
                                            proximoFoco: 'rsdescontos',
                                            fieldLabel: 'Log',
                                            ui: 'field-readonly',
                                            fieldStyle:'color:green;font-size:8px',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.MOVIMENTOS_LOG}'
                                            }
                                        }*/
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10 0 10 10',
                            defaultType: 'fieldcontainer',
                            flex: 1,
                            layout: 'vbox',
                            items: [
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    flex: 1,
                                    items: [
                                        {
                                            width: 120,
                                            fieldLabel: '% Desc',
                                            reference: 'percentualdescontos',
                                            mask: '#9.999.990,000',
                                            proximoFoco: 'rsdesc',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MOVIMENTOS_PERCENTUAL}',
                                                readOnly: '{readOnly || isDescontoPorItem || digitouDescontoCabecalhoEmDinheiro || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                ui: '{isDescontoPorItem || digitouDescontoCabecalhoEmDinheiro || (isDescontoPorItemECabecalho && digitouDescontoItem) ? "field-readonly" : "textbold-' + tema + '"}'
                                            },
                                            listeners: {
                                                render: 'onUpdateField'
                                            }
                                        },
                                        {
                                            width: 120,
                                            fieldLabel: 'R$ Desc',
                                            reference: 'rsdescontos',
                                            xtype: 'samoswidgets-textmoney',
                                            proximoFoco: 'produtos',
                                            bind: {
                                                value: '{model.MOVIMENTOS_DESCONTOS}',
                                                readOnly: '{readOnly || isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                ui: '{isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem) ? "field-readonly" : "textbold-' + tema + '"}'
                                            },
                                            listeners: {
                                                render: 'onUpdateField'
                                            }
                                        }
                                    ]
                                },
                                {
                                    xtype: 'container',
                                    layout: 'hbox',
                                    flex: 1,
                                    items: [
                                        {
                                            width: 120,
                                            fieldLabel: 'Produtos',
                                            reference: 'produtos_valor',
                                            proximoFoco: 'total',
                                            xtype: 'samoswidgets-textmoney',
                                            fieldStyle: 'color:green',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.MOVIMENTOS_PRODUTOS}'
                                            }
                                        },
                                        {
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
                //O ERRO ESTA AQUI PRA BAIXO
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
                                onUpdate: 'atualizarCalculos',
                                aposAbrirJanelaDetalhes: 'setarDefaultsJanelaDetalhes'
                            },
                            fields: [
                                { hidden: true, name: 'MOVIMENTOSITENS_ID' },
                                {
                                    width: 100,
                                    xtype: 'samoswidgets-textcustomsearch',
                                    title: 'Produto',
                                    fieldStyle: 'text-align:right;',
                                    permitirApenasNumeros: true,
                                    name: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                    //reference: 'produtoprincipal',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    search: { 
                                        url: '/consultas/produtos',
                                        query: {
                                            ordem: 1,
                                            status: 'T'
                                        },
                                        listeners: {
                                            afterSelection: 'prepararProduto',
                                        },
                                        toolbar: [
                                            {
                                                xtype: 'textfield',
                                                fieldLabel: 'Conteúdo',
                                                reference: 'conteudo',
                                                flex: 3
                                            },
                                            {
                                                xtype: 'combobox',
                                                fieldLabel: 'Ordem',
                                                reference: 'ordem',
                                                value: 1,
                                                editable: false,
                                                width: 135,
                                                store: [
                                                    [0, 'Nome'],
                                                    [1, 'Contéudo'],
                                                    [2, 'Código']
                                                ]
                                            },
                                            {
                                                xtype: 'combobox',
                                                fieldLabel: 'Status',
                                                reference: 'status',
                                                value: 'T',
                                                width: 165,
                                                editable: false,
                                                store: configs.getProdutos().status
                                            }
                                        ],
                                        columns: [
                                            {
                                                width: 80,
                                                text: 'Código',
                                                dataIndex: 'PRODUTOS_ID',
                                                align: 'center'
                                            },
                                            {
                                                flex: 1,
                                                text: 'Nome',
                                                dataIndex: 'PRODUTOS_NOME'
                                            },
                                            {
                                                width: 80,
                                                text: 'Saldo',
                                                align: 'right',
                                                dataIndex: 'SALDOS_DISPONIVEL'
                                            },
                                            {
                                                width: 80,
                                                text: 'Preço',
                                                align: 'right',
                                                dataIndex: 'SALDOS_PRECO'
                                            },
                                            {
                                                width: 80,
                                                text: 'Prazo',
                                                align: 'right',
                                                dataIndex: 'SALDOS_PRAZO'
                                            }
                                        ]
                                    }
                                },
                                {
                                    title: 'Nome',
                                    reference: 'nomedoProduto',
                                    hidden: !configs.getMovimentos().gridProdutos['PRODUTOS_NOME'],
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    maxLength: 100,                                    
                                    proximoFoco: 'qtde',                                    
                                    readOnly: true
                                },
                                {
                                    title: 'Local',
                                    hidden: !configs.getMovimentos().gridProdutos['SALDOS_LOCAL'],                                    
                                    name: 'SALDOS_LOCAL',
                                    width: 90,
                                    xtype: 'textfield',
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'center'
                                    }
                                },
                                {
                                    title: 'Qtde',
                                    name: 'MOVIMENTOSITENS_QUANTIDADE',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    listeners: {
                                        blur: 'validarQtdeMaxima'
                                    },
                                    width: 60,
                                    bind: {    
                                        proximoFoco: `{
                                            permitidoAlterarPreco ? 
                                            "preco" : 
                                            isDescontoPorItem ? 
                                            "dsc" : 
                                            isDescontoPorItemECabecalho ?
                                                digitouDescontoCabecalho ? 
                                                "produto[linhadebaixo]" : 
                                                "dsc" :
                                            "produto[linhadebaixo]"
                                        }`,
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Preço',
                                    empty: true,
                                    name: 'MOVIMENTOSITENS_PRECO',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,' + ('0'.repeat(configs.getMovimentos().casasDecimaisPreco || 2)),
                                    hidden: !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_PRECO'],
                                    listeners: {
                                        blur: 'atualizarCalculos'
                                    },
                                    proximoFoco: 'produto[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly || !permitidoAlterarPreco}'
                                    }
                                },
                                {
                                    title: 'Total',
                                    name: 'MOVIMENTOSITENS_TOTAL',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    readOnly: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    bind: {
                                        hidden: configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_TOTAL'] ? '{!isDescontoCabecalho}' : true,
                                    }
                                },
                                {
                                    title: 'Vlr Líquido',
                                    name: 'VALOR_LIQUIDO',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    hidden: !configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_LIQUIDO'],
                                    bind: {
                                        readOnly: '{readOnly || (isDescontoPorItemECabecalho && digitouDescontoCabecalho)}'
                                    }
                                },
                                {
                                    title: 'Tot Líquido',
                                    name: 'TOTAL_LIQUIDO',
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly || isDescontoCabecalho || (isDescontoPorItemECabecalho && digitouDescontoCabecalho)}',
                                        width: '{isDescontoCabecalho ? 0 : 100}',
                                        hidden: configs.getMovimentos().gridProdutos['MOVIMENTOSITENS_TOTALLIQUIDO'] ? '{isDescontoCabecalho}' : true
                                    }
                                },
                                { hidden: true, name: 'SALDOS_PRAZO' },
                                { hidden: true, name: 'SALDOS_PRECO' },
                                { hidden: true, name: 'SALDOS_PRECOMINIMO' },
                                { hidden: true, name: 'PRECOMINIMO_DB' },
                                { hidden: true, name: 'SALDOS_CSTLOCAL' },
                                { hidden: true, name: 'SALDOS_DISPONIVEL' },
                                { hidden: true, name: 'PRODUTOS_DESCRICAO'},
                                { hidden: true, name: 'PRODUTOS_STATUS' },
                                { hidden: true, name: 'PRODUTOS_DERIVADO' },
                                { hidden: true, name: 'SALDOS_ICMSLC' },
                                { hidden: true, name: 'NCMS_STATUS' },
                                { hidden: true, name: 'NCMS_NCM' },
                                { hidden: true, name: 'NCMS_ALIQUOTANACIONAL' },
                                { hidden: true, name: 'NCMS_ALIQUOTAESTADUAL' },
                                { hidden: true, name: 'NCMS_ALIQUOTAIMPORTADO' },
                                { hidden: true, name: 'NCMS_ALIQUOTAMUNICIPAL' },
                                { hidden: true, name: 'MOVIMENTOSITENS_ID_OPERACOES' },
                                { hidden: true, name: 'MOVIMENTOSITENS_IMPOSTO' },
                                { hidden: true, name: 'MOVIMENTOSITENS_CST' }
                            ]
                        }
                    ]
                }
            ]
        });
        
        this.callParent(arguments);

        if(!configs.getEmpresa().regimeCaixa) {
            const btn = this.down('button[text="Caixa"]');
            btn.setText('Pagamento');
        }
    }
});
