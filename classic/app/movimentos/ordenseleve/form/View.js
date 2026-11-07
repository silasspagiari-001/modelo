Ext.define('SamosAdmin.movimentos.ordenseleve.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formordenseleve',

    requires: [
        'SamosAdmin.movimentos.ordenseleve.form.ViewModel',
        'SamosAdmin.movimentos.ordenseleve.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir',
        'Baixar',
        'Finalizar',
        'Reativar',
        'Espelho NFS-e',
        'Exportar: Para Nota Serviços'        
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
                                    proximoFoco: 'contato',
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
                                            ['PESSOAS_CELULAR',    'PESSOAS_CELULAR'],
                                            ['ORDENS_CELULAR',    'PESSOAS_CELULAR']
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
                                    proximoFoco: 'usuario',
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
                                    proximoFoco: 'contato',
                                    fieldLabel: 'Cnpj/Cpf',
                                    bind: {
                                        value: '{model.ORDENS_CPFCNPJ}',
                                        ui: '{isOSConsumidor ? "textbold-' + tema + '" : "field-readonly"}',
                                        readOnly: '{readOnly || !isOSConsumidor}',
                                    }
                                },
                                {
                                    flex: false,
                                    width: 130,
                                    fieldLabel: 'Contato',
                                    reference: 'contato',
                                    proximoFoco: 'celular',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.ORDENS_NUMEROLC}',
                                        readOnly: '{readOnly}'
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
                                        width: 130,
                                    fieldLabel: 'Fone Contato',
                                    reference: 'celular',
                                    proximoFoco: 'dataservico',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.ORDENS_CELULAR}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 120,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'email', 
                                    readOnly: true,                                   
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
                                    flex: false,
                                    width: 214,
                                    reference: 'criacao',
                                    proximoFoco: 'hora',
                                    fieldLabel: 'Incluído por',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green;font-size:10px',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ORDENS_IMPORTADA}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 214,
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
                                    reference: 'dataservico',
                                    fieldLabel: 'Data Serviço',                                    
                                    proximoFoco: 'servicorealizar',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        ui: '{textbold-' + tema + '}',
                                        value: '{model.ORDENS_REABERTURA}'
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
                                        ['N', 'Em Aberto' ],
                                        ['E', 'Finalizada'],
                                        ['C', 'Cancelada'],                                        
                                        ['F', 'Faturada']
                                    ],
                                    bind: {
                                        fieldStyle: '{isExecutado ? "color:blue" : isFaturado ? "color:black" : isCancelado ? "color:red" : "color:green"}',
                                        value: '{model.ORDENS_STATUS}'
                                    }
                                }                                
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    hidden: true,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    reference: 'usuario',
                                    fieldLabel: 'Motorista/Operador',
                                    proximoFoco: 'servicorealizar',
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
                                    flex: 1,
                                    fieldLabel: 'Serviço',
                                    reference: 'servicorealizar',
                                    proximoFoco: 'comprimento',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.ORDENS_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },  
                                {
                                    width: 75,
                                    fieldLabel: 'Almoço das',
                                    reference: 'almocodas',
                                    bind: {
                                        value: '{model.ALMOCO_INICIO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                    
                                {
                                    width: 75,
                                    fieldLabel: 'Almoço até',
                                    reference: 'almocoate',
                                    bind: {
                                        value: '{model.ALMOCO_FIM}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                    
                                {
                                    width: 70,
                                    fieldLabel: 'Jantar das',
                                    reference: 'jantardas',
                                    bind: {
                                        value: '{model.JANTAR_INICIO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                    
                                {
                                    width: 70,
                                    fieldLabel: 'Jantar até',
                                    reference: 'jantarate',
                                    bind: {
                                        value: '{model.JANTAR_FIM}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                    
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 95,
                                    reference: 'comprimento',
                                    proximoFoco: 'largura',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Comprimento',
                                    bind: {
                                        value: '{model.SERVICO_COMPRIMENTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                            
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 77,
                                    reference: 'largura',
                                    proximoFoco: 'altura',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Largura',
                                    bind: {
                                        value: '{model.SERVICO_LARGURA}',
                                        readOnly: '{readOnly}'
                                    }
                                },                            
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 77,
                                    reference: 'altura',
                                    proximoFoco: 'peso',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Altura',
                                    bind: {
                                        value: '{model.SERVICO_ALTURA}',
                                        readOnly: '{readOnly}'
                                    }
                                },                            
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: false,
                                    width: 77,
                                    reference: 'peso',
                                    proximoFoco: 'localservico',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Peso',
                                    bind: {
                                        value: '{model.SERVICO_PESO}',
                                        readOnly: '{readOnly}'
                                    }
                                },  
                                // vai substituir o proximo
                                {
                                    xtype: 'numberfield',
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'NFS-e',
                                    reference: 'numeroorigem',
                                    proximoFoco: 'numeroorigem',
                                    emptyText: '0',
                                    hideTrigger: true,
                                    allowDecimals: false,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 0,
                                    maxLength: 6,
                                    bind: {
                                        value: '{model.ORDENS_NUMEROORIGEM}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                        
                                {
                                    flex: false,
                                    width: 40,
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
                            layout: 'hbox',
                            items: [
                                {
                                    xtype: 'textarea',
                                    fieldLabel: 'Local do Serviço/Endereço',
                                    flex: 0.5,
                                    height: 100,
                                    maxLength: 100,
                                    reference: 'localservico',                                    
                                    proximoFoco: 'observacoes',
                                    bind: {                  
                                        value: '{model.ORDENS_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
                                    fieldLabel: 'Observações',
                                    flex: 0.5,
                                    height: 100,
                                    maxLength: 512,
                                    reference: 'observacoes',                                    
                                    bind: {                  
                                        value: '{model.ORDENS_OBSERVACOES}',
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
                            height: 118,
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            items: [
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
                    title: 'Serviços',
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'servicos',
                            qtdeLinhasMinima: 2, // 3
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
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
                                    title: 'Operador',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    proximoFoco: 'equipamento',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararServico',
                                    name: 'ORDENSSERVICOS_ID_USUARIOS',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['ORDENSSERVICOS_ID_USUARIOS', 'USUARIOS_ID'],
                                        ['USUARIOS_LOGIN',             'USUARIOS_LOGIN']
                                    ]
                                },
                                {
                                    title: 'Nome',
                                    width: 100,
                                    xtype: 'textfield',
                                    name: 'USUARIOS_LOGIN',
                                    readOnly: true,
                                    hidden: true
                                },
                                {
                                    title: 'Equipamento',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'veiculos', // servicos
                                    proximoFoco: 'dataser',
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
                                    title: 'Descrição',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'SERVICOS_NOME',
                                    readOnly: true
                                },
                                {
                                    xtype: 'combobox',
                                    width: 80,
                                    name: 'ITEM_HORALOCAL',
                                    editable: false,                                            
                                    title: 'No Local',
                                    reference: 'diarialocal',
                                    proximoFoco: 'diariainicio',
                                    forceSelection: true,
                                    store: (() => {
                                        const s = moment().hour(23).minute(30);
                                        return new Array(24 * 2).fill(0).map(() => {
                                            return s.add(30, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
/*                                  listeners: {
                                        blur: 'validarHoraLocal'
                                    }*/
                                },
                                {
                                    name: 'ITEM_MINIMO',
                                    title: 'Hrs(Mín)',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    width: 100,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: '0',
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    proximoFoco: 'operador[linhadebaixo]',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },                                    
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 80,
                                    name: 'ITEM_PREVISTO',
                                    editable: false,                                            
                                    title: 'Previsto',
                                    reference: 'diariaprevisto',
                                    proximoFoco: 'diariainicio',
                                    forceSelection: true,
                                    store: (() => {
                                        const s = moment().hour(23).minute(30);
                                        return new Array(24 * 2).fill(0).map(() => {
                                            return s.add(30, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Qtde',
                                    name: 'ORDENSSERVICOS_QUANTIDADE',
                                    reference: 'qtde',
                                    width: 60,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'operador[linhadebaixo]',
                                    bind: {
                                        readOnly: '{readOnly || !permitidoAlterarPreco}'
                                    }
                                },
                                {
                                    title: 'Preço/H',
                                    name: 'ORDENSSERVICOS_PRECO',
                                    reference: 'precoservico',                                    
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'operador[linhadebaixo]',
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
                                    proximoFoco: 'operador[linhadebaixo]',
                                    readOnly: true
                                },
                                {
                                    xtype: 'combobox',
                                    width: 80,
                                    name: 'ITEM_HORAINICIO',
                                    editable: false,                                            
                                    title: 'Inicio',
                                    reference: 'diariainicio',
                                    proximoFoco: 'diariafinal',
                                    forceSelection: true,
                                    store: (() => {
                                        const s = moment().hour(23).minute(30);
                                        return new Array(24 * 2).fill(0).map(() => {
                                            return s.add(30, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    width: 80,                                    
                                    name: 'ITEM_HORAFIM',
                                    editable: false,                                            
                                    title: 'Término',
                                    reference: 'diariafinal',
                                    forceSelection: true,
                                    proximoFoco: 'operador[linhadebaixo]',
                                    store: (() => {
                                        const s = moment().hour(23).minute(30);
                                        return new Array(24 * 2).fill(0).map(() => {
                                            return s.add(30, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    width: 65,
                                    name: 'ITEM_TEMPO',
                                    title: 'Tempo',
                                    proximoFoco: 'operador[linhadebaixo]',
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
