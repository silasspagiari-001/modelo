Ext.define('SamosAdmin.movimentos.ordenssky.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formordenssky',

    requires: [
        'SamosAdmin.movimentos.ordenssky.form.ViewModel',
        'SamosAdmin.movimentos.ordenssky.form.ViewController',
        'SamosAdmin.movimentos.ordenssky.form.agendamento.View',
        'SamosAdmin.movimentos.ordenssky.form.detalhesavariados.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        {
            action: 'Agendamento',
            ui: 'primary-green'
        },
        {
            action: 'Localização',
            ui: 'primary-blue'
        }
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

        Ext.apply(this, {
            formgroups: [
                {
                    ui: 'formpanel-noheader-' + tema,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            margin: '0',
                            padding: '0 0 5 0',
                            flex: 1,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
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
                                                value: '{model.ORDENS_NOME}',
                                                readOnly: '{readOnly}'
                                            },
                                            callbackFn: 'aposBuscarPessoa',
                                            associations:[
                                                ['ORDENS_NOME',       'PESSOAS_NOME'],
                                                ['ORDENS_ID_PESSOAS', 'PESSOAS_ID'],
                                                ['ORDENS_CPFCNPJ',    'PESSOAS_CPFCNPJ'],
                                                ['CIDADES_NOME',      'CIDADES_NOME'],
                                                ['CIDADES_ESTADO',    'CIDADES_ESTADO'],
                                                ['ORDENS_EMAIL',      'PESSOAS_EMAIL'],
                                                ['ORDENS_TELEFONE',   'PESSOAS_TELEFONE'],
                                                ['ORDENS_CELULAR',    'PESSOAS_CELULAR'],
                                                ['ORDENS_ENDERECO',   'PESSOAS_ENDERECO'],
                                                ['ORDENS_NUMERO',     'PESSOAS_NUMERO'],
                                                ['ORDENS_BAIRRO',     'PESSOAS_BAIRRO'],
                                                ['ORDENS_CEP',        'PESSOAS_CEP'],
                                                ['ORDENS_ID_CIDADES', 'PESSOAS_ID_CIDADES']
                                            ]
                                        },
                                        {
                                            hidden: true,
                                            bind: {
                                                value: '{model.ORDENS_ID_PESSOAS}'
                                            }
                                        },
                                        {
                                            reference: 'identificacao',
                                            fieldLabel: 'Identificação',
                                            proximoFoco: 'celular',
                                            width: 100,
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_IDENTIFICACAO}'
                                            }
                                        },
                                        {
                                            xtype: 'samoswidgets-maskfield',
                                            textMask: '(__) _____-____',
                                            width: 120,
                                            reference: 'celular',
                                            proximoFoco: 'contatos',
                                            fieldLabel: 'Celular',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_CELULAR}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            xtype: 'samoswidgets-textsearch',
                                            width: 125,
                                            fieldLabel: 'CEP',
                                            reference: 'cep',
                                            naoFocarAposPesquisar: true,
                                            maxLength: 9,
                                            tabela: 'ceps',
                                            buscarPor: 'CEP',
                                            associations: [
                                                ['ORDENS_CEP',      'CEPS_CEP'],
                                                ['ORDENS_ENDERECO', 'CEPS_ENDERECO'],
                                                ['ORDENS_BAIRRO',   'CEPS_BAIRRO'],
                                                ['CIDADES_NOME',    'CEPS_CIDADE'],
                                                ['CIDADES_ESTADO',  'CEPS_ESTADO']
                                            ],
                                            bind: {
                                                value: '{model.ORDENS_CEP}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            xtype: 'samoswidgets-textsearch',
                                            fieldLabel: 'Cidade',
                                            tabela: 'cidades',
                                            reference: 'cidade',
                                            proximoFoco: 'endereco',
                                            buscarPor: 'Genérica',
                                            callbackFn: 'validarCidade',
                                            associations: [
                                                ['CIDADES_NOME',      'CIDADES_NOME'],
                                                ['ORDENS_ID_CIDADES', 'CIDADES_ID'],
                                                ['CIDADES_ESTADO',    'CIDADES_ESTADO']
                                            ],
                                            bind: {
                                                value: '{model.CIDADES_NOME}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            hidden: true,
                                            reference: 'idcidades',
                                            bind: {
                                                value: '{model.ORDENS_ID_CIDADES}'
                                            }
                                        },
                                        {
                                            width: 65,
                                            fieldLabel: 'UF',
                                            reference: 'uf',
                                            maxLength: 2,
                                            proximoFoco: 'endereco',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.CIDADES_ESTADO}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            fieldLabel: 'Endereço',
                                            maxLength: 50,
                                            reference: 'endereco',
                                            proximoFoco: 'numerolc',
                                            bind: {
                                                value: '{model.ORDENS_ENDERECO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            width: 65,
                                            fieldLabel: 'Número',
                                            reference: 'numerolc',
                                            proximoFoco: 'bairro',
                                            maxLength: 10,
                                            bind: {
                                                value: '{model.ORDENS_NUMEROLC}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            fieldLabel: 'Técnico',
                                            reference: 'usuario',
                                            proximoFoco: 'periodo',
                                            readOnly: true,
                                            ui: 'field-readonly',
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
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            fieldLabel: 'Plano',
                                            reference: 'plano',
                                            proximoFoco: 'status',
                                            maxLength: 50,
                                            bind: {
                                                value: '{model.ORDENS_PLANO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            reference: 'log',
                                            proximoFoco: 'periodo',
                                            fieldLabel: 'Log',
                                            fieldStyle:'text-align:left;color:green;',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            bind: {
                                                value: '{model.ORDENS_LOG}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            margin: '0',
                            padding: '0 0 5 0',
                            flex: 1,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            reference: 'contatos',
                                            fieldLabel: 'Telefones',
                                            proximoFoco: 'usuario',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_CONTATOS}'
                                            }
                                        },
                                        {
                                            width: 85,
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
                                            width: 35,
                                            fieldLabel: 'Série',
                                            reference: 'serie',
                                            proximoFoco: 'contatos',
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
                                            fieldLabel: 'Bairro',
                                            reference: 'bairro',
                                            proximoFoco: 'pontodereferencia',
                                            maxLength: 50,
                                            bind: {
                                                value: '{model.ORDENS_BAIRRO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Ponto de Referência',
                                            reference: 'pontodereferencia',
                                            proximoFoco: 'complemento',
                                            maxLength: 50,
                                            bind: {
                                                value: '{model.ORDENS_REFERENCIA}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            fieldLabel: 'Complemento',
                                            reference: 'complemento',
                                            proximoFoco: 'descricaoativas0',
                                            maxLength: 50,
                                            bind: {
                                                value: '{model.ORDENS_COMPLEMENTO}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            xtype: 'samoswidgets-textsearch',
                                            fieldLabel: 'Reabertura Técnico',
                                            tabela: 'usuarios',
                                            reference: 'tecnico',
                                            proximoFoco: 'periodo',
                                            naoFocarAposPesquisar: true,
                                            buscarPor: 'Genérica',
                                            callbackFn: 'updateLog',
                                            associations: [
                                                ['TECNICO_NOME',      'USUARIOS_NOME'],
                                                ['ORDENS_ID_TECNICO', 'USUARIOS_ID']
                                            ],
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.TECNICO_NOME}'
                                            }
                                        },
                                        {
                                            hidden: true,
                                            bind: {
                                                value: '{model.ORDENS_ID_TECNICO}'
                                            }
                                        },
                                        {
                                            xtype: 'datefield',
                                            fieldLabel: 'Reabertura',
                                            reference: 'reabertura',
                                            proximoFoco: 'referencia',
                                            width: 88,
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.ORDENS_REABERTURA}'
                                            }
                                        },
                                        {
                                            fieldLabel: 'Hora',
                                            reference: 'horareabertura',
                                            proximoFoco: 'contatos',
                                            maxLength: 5,
                                            width: 55,
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            fieldStyle:'text-align:center;',
                                            bind: {
                                                value: '{model.ORDENS_HORAREABERTURA}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            xtype: 'datefield',
                                            fieldLabel: 'Captura',
                                            reference: 'emissao',
                                            proximoFoco: 'referencia',
                                            width: 88,
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.ORDENS_EMISSAO}'
                                            }
                                        },
                                        {
                                            fieldLabel: 'Hora',
                                            reference: 'horacaptura',
                                            proximoFoco: 'contatos',
                                            maxLength: 5,
                                            width: 55,
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            fieldStyle:'text-align:center;',
                                            bind: {
                                                value: '{model.ORDENS_HORAEMISSAO}'
                                            }
                                        },
                                        {
                                            width: 52,
                                            fieldLabel: 'Tempo',
                                            reference: 'tempo',
                                            proximoFoco: 'descricao',
                                            maxLength: 10,
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_TEMPO}'
                                            }
                                        },
                                        {
                                            width: 95,
                                            xtype: 'combobox',
                                            fieldLabel: 'Período',
                                            reference: 'periodo',
                                            proximoFoco: 'descricao',
                                            displayField: 'field2',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_PERIODO}'
                                            },
                                            store: [
                                                ['M', 'Manhã'],
                                                ['T', 'Tarde'],
                                                ['N', 'Noite'],
                                                ['D', 'Definir']
                                            ]
                                        },
                                        {
                                            flex: 1,
                                            xtype: 'combobox',
                                            editable: false,
                                            fieldLabel: 'Status',
                                            reference: 'status',
                                            proximoFoco: 'usuario',
                                            displayField: 'field2',
                                            store: [
                                                ['1', 'Tratativa Manual'],
                                                ['2', 'Aberta'],
                                                ['3', 'Desconhecido'],
                                                ['4', 'Aceita'],
                                                ['5', 'Em deslocamento'],
                                                ['6', 'Em execucao'],
                                                ['7', 'Concluida com sucesso'],
                                                ['8', 'Concluida sem sucesso'],
                                                ['9', 'Cancelada'],
                                                ['0', 'Realocada']
                                            ],
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.ORDENS_STATUS}',
                                                fieldStyle: '{colorStatus}'
                                            }
                                        }
                                    ]
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
                    title: 'Serviços a Executar',
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'instalacoesavariados',
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: true,
                            name: 'ORDENS_AVARIADOS',
                            idProperty: 'ORDENSAVARIADOS_ID',
                            descartarSeVazio: 'ORDENSAVARIADOS_REFERENCIA',
                            janelaDetalhes: {
                                xtype: 'ordensskyformdetalhesavariados'
                            },
                            bind: {
                                store: '{instalacoesavariados}'
                            },
                            fields: [
                                { hidden: true, name: 'ORDENSAVARIADOS_ID' },
                                { hidden: true, name: 'ORDENSAVARIADOS_ID_ORDENS' },
                                {
                                    title: 'Referência',
                                    maxLength: 50,
                                    width: 120,
                                    xtype: 'textfield',
                                    reference: 'referencia',
                                    proximoFoco: 'sigla',
                                    name: 'ORDENSAVARIADOS_REFERENCIA',
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        render: 'preencherReferencia'
                                    }
                                },
                                {
                                    title: 'Sigla',
                                    name: 'ORDENSAVARIADOS_SIGLA',
                                    xtype: 'combobox',
                                    emptyText: '',
                                    width : 80,
                                    reference: 'sigla',
                                    proximoFoco: 'descricaoavariados',
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    },
                                    store: [
                                        'AC',
                                        'PS',
                                        'AP',
                                        'PP',
                                        'PO',
                                        'SB',
                                        'RV',
                                        'RM',
                                        'RO',
                                        'RS',
                                        'RT',
                                        'SCL',
                                        'SCD',
                                        'SPE'
                                    ]
                                },
                                {
                                    title: 'Serviços',
                                    maxLength: 50,
                                    flex: 1,
                                    xtype: 'textfield',
                                    reference: 'descricaoavariados',
                                    proximoFoco: 'agendamento',
                                    name: 'ORDENSAVARIADOS_DESCRICAO',
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Agendamento',
                                    width: 105,
                                    xtype: 'datefield',
                                    reference: 'agendamento',
                                    proximoFoco: 'horaagendada',
                                    name: 'ORDENSAVARIADOS_AGENDADA',
                                    readOnly: true
                                },
                                {
                                    title: 'Hora',
                                    width: 60,
                                    xtype: 'textfield',
                                    reference: 'horaagendada',
                                    proximoFoco: 'execucao',
                                    maxLength: 5,
                                    fieldStyle: 'text-align:center;',
                                    name: 'ORDENSAVARIADOS_HORAAGENDADA',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Execução',
                                    width: 130,
                                    xtype: 'datefield',
                                    reference: 'execucao',
                                    proximoFoco: 'horaexecucao',
                                    name: 'ORDENSAVARIADOS_EXECUCAO',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Hora',
                                    width: 60,
                                    maxLength: 5,
                                    xtype: 'textfield',
                                    reference: 'horaexecucao',
                                    proximoFoco: 'referencia[linhadebaixo]',
                                    fieldStyle: 'text-align:center;',
                                    name: 'ORDENSAVARIADOS_HORAEXECUCAO',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'AF',
                                    name: 'ORDENSAVARIADOS_SITUACAO',
                                    width: 80,
                                    xtype: 'checkbox',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    checked: false
                                },
                                { hidden: true, name: 'ORDENSAVARIADOS_SERIAL' },
                                { hidden: true, name: 'ORDENSAVARIADOS_CARTAO' },
                                { hidden: true, name: 'ORDENSAVARIADOS_CRIACAO' },
                                { hidden: true, name: 'ORDENSAVARIADOS_HORACRIACAO' },
                                { hidden: true, name: 'ORDENSAVARIADOS_LOCACAO' },
                                { hidden: true, name: 'ORDENSAVARIADOS_HORALOCACAO' },
                                { hidden: true, name: 'ORDENSAVARIADOS_LIMITE' },
                                { hidden: true, name: 'ORDENSAVARIADOS_HORALIMITE' }
                            ]
                        }
                    ]
                },
                {
                    xtype: 'container',
                    padding: 0,
                    layout: 'hbox',
                    defaults: {
                        xtype: 'samoswidgets-defaultform',
                        ui: 'formpanel-clean-' + tema
                    },
                    items: [
                        {
                            title: 'Instalações Ativas',
                            padding: '5 10 20 20',
                            height: 253,
                            scrollable: 'y',
                            items: [
                                {
                                    xtype: 'samoswidgets-griditems',
                                    padding: '0 10 0 0',
                                    reference: 'instalacoesativas',
                                    qtdeLinhasMinima: 3,
                                    mostrarNumeroLinhas: true,
                                    permitidoGridVazia: true,
                                    name: 'ORDENS_ATIVOS',
                                    idProperty: 'ORDENSATIVOS_ID',
                                    descartarSeVazio: 'ORDENSATIVOS_DESCRICAO',
                                    bind: {
                                        store: '{instalacoesativas}'
                                    },
                                    fields: [
                                        { hidden: true, name: 'ORDENSATIVOS_ID' },
                                        { hidden: true, name: 'ORDENSATIVOS_ID_ORDENS' },
                                        { hidden: true, name: 'ORDENSATIVOS_REFERENCIA' },
                                        {
                                            title: 'Modelo do Equipamento',
                                            maxLength: 50,
                                            flex: 1,
                                            xtype: 'textfield',
                                            reference: 'descricaoativas',
                                            proximoFoco: 'serialativas',
                                            name: 'ORDENSATIVOS_DESCRICAO',
                                            bind: {    
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'Serial',
                                            maxLength: 20,
                                            width: 160,
                                            xtype: 'textfield',
                                            reference: 'serialativas',
                                            proximoFoco: 'cartaoativas',
                                            name: 'ORDENSATIVOS_SERIAL',
                                            bind: {    
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            title: 'Cartão',
                                            maxLength: 20,
                                            width: 120,
                                            xtype: 'textfield',
                                            reference: 'cartaoativas',
                                            proximoFoco: 'descricaoativas[linhadebaixo]',
                                            name: 'ORDENSATIVOS_CARTAO',
                                            bind: {    
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            title: 'Informações Complementares',
                            padding: '5 20 20 5',
                            flex: 1,
                            items: [
                                {
                                    xtype: 'container',
                                    padding: '10',
                                    margin: '0 0 10 0',
                                    style: 'border:1px solid #c5c5c5 !important;',
                                    defaultType: 'fieldcontainer',
                                    layout: 'fit',
                                    items: [
                                        {
                                            xtype: 'samoswidgets-textlist',
                                            height: 148,
                                            lines: 10,
                                            lineHeight: 30,
                                            maxLength: 50,
                                            reference: 'observacoes',
                                            proximoFoco: 'rsdescontos',
                                            bind: {
                                                value: '{model.ORDENS_OBSERVACOES}',
                                                readOnly: '{readOnly}'
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
                                        readOnly: '{readOnly || !isMaster}'
                                    },
                                    associations:[
                                        ['ORDENSPRODUTOS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',              'PRODUTOS_NOME'],
                                        ['ORDENSPRODUTOS_CUSTO',       'SALDOS_CUSTO'],
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
                                    proximoFoco: 'produto[linhadebaixo]',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {    
                                        readOnly: '{readOnly || !isMaster}'
                                    }
                                },
                                {
                                    title: 'Preço',
                                    name: 'ORDENSPRODUTOS_PRECO',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    readOnly: true
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
                                        readOnly: '{readOnly || !isMaster}'
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
                                        readOnly: '{readOnly || !isMaster}'
                                    }
                                },
                                {
                                    title: 'Preço',
                                    name: 'ORDENSSERVICOS_PRECO',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'servico[linhadebaixo]',
                                    readOnly: true
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
                },
                {
                    bind: {
                        hidden: '{hideTotais}'
                    },
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'container',
                                    flex: 1,
                                },
                                {
                                    fieldLabel: 'Produtos',
                                    reference: 'totalprodutos',
                                    fieldStyle: 'color:green',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    width: 130,
                                    bind: {
                                        value: '{model.ORDENS_PRODUTOS}'
                                    }
                                },
                                {
                                    fieldLabel: 'Serviços',
                                    reference: 'totalservicos',
                                    fieldStyle: 'color:green',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    width: 130,
                                    bind: {
                                        value: '{model.ORDENS_SERVICOS}'
                                    }
                                },
                                {
                                    fieldLabel: 'Descontos',
                                    reference: 'totaldescontos',
                                    fieldStyle: 'color:black',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    width: 130,
                                    bind: {
                                        value: '{model.ORDENS_DESCONTOS}'
                                    }
                                },
                                {
                                    fieldLabel: 'Total',
                                    reference: 'total',
                                    fieldStyle: 'color:blue',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    width: 130,
                                    bind: {
                                        value: '{model.ORDENS_TOTAL}'
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
