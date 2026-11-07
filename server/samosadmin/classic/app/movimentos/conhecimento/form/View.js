Ext.define('SamosAdmin.movimentos.conhecimento.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formconhecimento',

    requires: [
        'SamosAdmin.movimentos.conhecimento.form.ViewModel',
        'SamosAdmin.movimentos.conhecimento.form.ViewController'
    ],

    title: 'Conhecimento Transporte',

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Sefaz'
    ],

    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function () {
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
                                    fieldLabel: 'Remetente',
                                    tabela: 'pessoas',
                                    reference: 'rementente',
                                    proximoFoco: 'destinatario',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_NOME',             'PESSOAS_NOME'],
                                        ['CONHECIMENTOS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['PESSOAS_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_PESSOAS}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 45,
                                    flex: false,
                                    reference: 'remetenteuf',
                                    proximoFoco: 'destinatario',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_UF}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Destinatário',
                                    tabela: 'pessoas',
                                    reference: 'destinatario',
                                    proximoFoco: 'emissao',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['DESTINATARIO_NOME',             'PESSOAS_NOME'],
                                        ['CONHECIMENTOS_ID_DESTINATARIO', 'PESSOAS_ID'],
                                        ['DESTINATARIO_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.DESTINATARIO_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_DESTINATARIO}'
                                    },
                                    listeners: {
                                        change: 'onDestinatarioChange'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 45,
                                    flex: false,
                                    reference: 'destinatariouf',
                                    proximoFoco: 'expedidor',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.DESTINATARIO_UF}'
                                    }
                                },
                                {
                                    fieldLabel: 'Emissão',
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    reference: 'emissao',
                                    proximoFoco: 'expedidor',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_EMISSAO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    flex: false,
                                    width: 80,
                                    reference: 'hora',
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_HORA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Número',
                                    flex: false,
                                    width: 75,
                                    reference: 'numero',
                                    proximoFoco: 'serie',
                                    fieldStyle:'text-align:right',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    fieldLabel: 'Série',
                                    flex: false,
                                    width: 50,
                                    reference: 'serie',
                                    proximoFoco: 'email',
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
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Expedidor',
                                    tabela: 'pessoas',
                                    reference: 'expedidor',
                                    proximoFoco: 'recebedor',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['EXPEDIDOR_NOME',             'PESSOAS_NOME'],
                                        ['CONHECIMENTOS_ID_EXPEDIDOR', 'PESSOAS_ID'],
                                        ['EXPEDIDOR_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.EXPEDIDOR_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_EXPEDIDOR}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 45,
                                    flex: false,
                                    reference: 'expedidoruf',
                                    proximoFoco: 'recebedor',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.EXPEDIDOR_UF}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 304,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Recebedor',
                                    tabela: 'pessoas',
                                    reference: 'recebedor',
                                    proximoFoco: 'tomador',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['RECEBEDOR_NOME',             'PESSOAS_NOME'],
                                        ['CONHECIMENTOS_ID_RECEBEDOR', 'PESSOAS_ID'],
                                        ['RECEBEDOR_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.RECEBEDOR_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_RECEBEDOR}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 45,
                                    flex: false,
                                    reference: 'recebedoruf',
                                    proximoFoco: 'recebedor',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.RECEBEDOR_UF}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 295,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Tomador',
                                    tabela: 'pessoas',
                                    reference: 'tomador',
                                    proximoFoco: 'operacao',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['TOMADOR_NOME',             'PESSOAS_NOME'],
                                        ['CONHECIMENTOS_ID_TOMADOR', 'PESSOAS_ID'],
                                        ['TOMADOR_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.TOMADOR_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_TOMADOR}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 50,
                                    flex: false,
                                    reference: 'tomadoruf',
                                    proximoFoco: 'recebedor',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.TOMADOR_UF}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Outros',
                    ui: 'formpanel-noheader-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    width: 95,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Operação',
                                    tabela: 'operacoes',
                                    reference: 'operacao',
                                    proximoFoco: 'tipocte',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['CONHECIMENTOS_ID_OPERACOES', 'OPERACOES_ID'],
                                        ['OPERACOES_NOME',             'OPERACOES_NOME'],
                                    ],
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_OPERACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 232,
                                    reference: 'nomeoperacao',
                                    proximoFoco: 'tipocte',
                                    fieldLabel: 'Descrição',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.OPERACOES_NOME}'
                                    }
                                },
                                // FIM DO NOVO
                                {
                                    fieldLabel: 'Tipo CT-e',
                                    flex: false,
                                    width: 110,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tipocte',
                                    proximoFoco: 'tiposervico',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['N', 'Normal']
                                    ],
                                    bind: {
                                        value: '{model.CONHECIMENTOS_TIPOCTE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Tipo Serviço',
                                    flex: false,
                                    width: 180,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tiposervico',
                                    proximoFoco: 'tomadorservico',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['N', 'Normal'],
                                        ['S', 'Sub Contratação'],
                                        ['R', 'Redespacho'],
                                        ['I', 'Intermediário']
                                    ],
                                    bind: {
                                        value: '{model.CONHECIMENTOS_TIPOSERVICO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Tomador do Serviço',
                                    flex: false,
                                    width: 160,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tomadorservico',
                                    proximoFoco: 'formapgto',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['R', 'Remetente'],
                                        ['E', 'Expedidor'],
                                        ['C', 'Recebedor'],
                                        ['D', 'Destinatário']
                                    ],
                                    bind: {
                                        value: '{model.CONHECIMENTOS_TOMADOR}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Forma de Pgto',
                                    flex: false,
                                    width: 105,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'formapgto',
                                    proximoFoco: 'prazo',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['P', 'Pago'],
                                        ['A', 'Aberto']
                                    ],
                                    bind: {
                                        value: '{model.CONHECIMENTOS_FORMAPGTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Status',
                                    width: 130,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'status',
                                    proximoFoco: 'rsdescontos',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', 'Não Enviado'],
                                        ['E', 'Enviado'],
                                        ['F', 'Faturado'],
                                        ['C', 'Cancelado']
                                    ],
                                    bind: {
                                        fieldStyle: '{isCancelado ? "color:red" : "color:green"}',
                                        value: '{model.CONHECIMENTOS_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Prazo',
                                    tabela: 'prazos',
                                    reference: 'prazo',
                                    proximoFoco: 'ibgeorigem',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PRAZOS_NOME',             'PRAZOS_NOME'],
                                        ['CONHECIMENTOS_ID_PRAZOS', 'PRAZOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.PRAZOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_OPERACOES}'
                                    }
                                },
                                {
                                    width: 110,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'IBGE Origem',
                                    tabela: 'cidades',
                                    reference: 'ibgeorigem',
                                    proximoFoco: 'ibgedestino',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['ORIGEM_IBGE',             'CIDADES_IBGE'],
                                        ['CONHECIMENTOS_ID_ORIGEM', 'CIDADES_ID'],
                                        ['ORIGEM_NOME',             'CIDADES_NOME'],
                                        ['ORIGEM_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.ORIGEM_IBGE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_ORIGEM}'
                                    }
                                },
                                {
                                    fieldLabel: 'Origem Prestação',
                                    flex: false,
                                    width: 178,
                                    reference: 'origemprestacao',
                                    proximoFoco: 'uforigemprestacao',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ORIGEM_NOME}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    flex: false,
                                    width: 45,
                                    reference: 'uforigemprestacao',
                                    proximoFoco: 'ibgedestino',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ORIGEM_UF}'
                                    }
                                },
                                {
                                    width: 110,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'IBGE Destino',
                                    tabela: 'cidades',
                                    reference: 'ibgedestino',
                                    proximoFoco: 'produtopredominante',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['DESTINO_IBGE',             'CIDADES_IBGE'],
                                        ['CONHECIMENTOS_ID_DESTINO', 'CIDADES_ID'],
                                        ['DESTINO_NOME',             'CIDADES_NOME'],
                                        ['DESTINO_UF',               'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.DESTINO_IBGE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_ID_DESTINO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Destino Prestação',
                                    flex: false,
                                    width: 192,
                                    reference: 'destinoprestacao',
                                    proximoFoco: 'ufdestinoprestacao',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.DESTINO_NOME}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    flex: false,
                                    width: 45,
                                    reference: 'ufdestinoprestacao',
                                    proximoFoco: 'ibgedestino',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.DESTINO_UF}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Produto',
                    ui: 'formpanel-noheader-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    fieldLabel: 'Produto Predominante',
                                    flex: false,
                                    width: 240,
                                    reference: 'produtopredominante',
                                    proximoFoco: 'qtde',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_PRODUTO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 70,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    fieldLabel: 'Qtde',
                                    reference: 'qtde',
                                    proximoFoco: 'entrega',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_QUANTIDADE}'
                                    }
                                },
                                {
                                    fieldLabel: 'Entrega',
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    reference: 'entrega',
                                    proximoFoco: 'responsavel',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_ENTREGA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Responsável',
                                    flex: false,
                                    width: 175,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'responsavel',
                                    proximoFoco: 'seguradora',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['R', 'Remetente'],
                                        ['E', 'Expedidor'],
                                        ['C', 'Recebedor'],
                                        ['D', 'Destinatário'],
                                        ['M', 'Emitente CT-e'],
                                        ['T', 'Tomador Serviço']
                                    ],
                                    bind: {
                                        value: '{model.CONHECIMENTOS_RESPONSAVEL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Seguradora',
                                    flex: 1,
                                    reference: 'seguradora',
                                    proximoFoco: 'apolice',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_SEGURADORA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Nº Apólice',
                                    flex: false,
                                    width: 130,
                                    reference: 'apolice',
                                    proximoFoco: 'averbacao',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_APOLICE}'
                                    }
                                },
                                {
                                    fieldLabel: 'Nº Averbação',
                                    flex: false,
                                    width: 130,
                                    reference: 'averbacao',
                                    proximoFoco: 'codigobarras',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_AVERBACAO}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código de Barras',
                                    flex: false,
                                    width: 240,
                                    reference: 'codigobarras',
                                    proximoFoco: 'protocolo',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_NFE}'
                                    }
                                },
                                {
                                    fieldLabel: 'Protocolo',
                                    flex: false,
                                    width: 205,
                                    reference: 'protocolo',
                                    proximoFoco: 'email',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_PROTOCOLO}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'email',
                                    fieldLabel: 'Email',
                                    flex: 2,
                                    proximoFoco: 'baseicms',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.CONHECIMENTOS_EMAIL}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    fieldLabel: 'Log',
                                    flex: false,
                                    width: 265,
                                    reference: 'log',
                                    proximoFoco: 'rsdescontos',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CONHECIMENTOS_LOG}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Impostos',
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
                                    proximoFoco: 'nota0',
                                    bind: {
                                        value: '{model.CONHECIMENTOS_OBSERVACOES}',
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
                            width: 330,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            width: 100,
                                            flex: false,
                                            fieldLabel: 'Base ICMS',
                                            reference: 'baseicms',
                                            proximoFoco: 'aliquotaicms',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_BASEICMS}'
                                            }
                                        },
                                        {
                                            width: 100,
                                            flex: false,
                                            fieldLabel: 'Alíquota ICMS',
                                            reference: 'aliquotaicms',
                                            proximoFoco: 'valoricms',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_ALIQUOTAICMS}'
                                            }
                                        },
                                        {
                                            width: 100,
                                            flex: false,
                                            fieldLabel: 'Valor ICMS',
                                            reference: 'valoricms',
                                            proximoFoco: 'reducao',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_VALORICMS}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            width: 100,
                                            flex: false,
                                            fieldLabel: '% Redução',
                                            reference: 'reducao',
                                            proximoFoco: 'pesoliquido',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_REDUCAO}'
                                            }
                                        },
                                        {
                                            width: 100,
                                            flex: false,
                                            fieldLabel: 'Peso Líquido',
                                            reference: 'pesoliquido',
                                            proximoFoco: 'cstlocal',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_PESOLIQUIDO}'
                                            }
                                        },
                                        {
                                            
                                            xtype: 'combobox',
                                            width: 100,
                                            flex: false,
                                            fieldLabel: 'CST Local',
                                            reference: 'cstlocal',
                                            proximoFoco: 'valoradiantado',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            fieldStyle: 'text-align:right',
                                            editable: false,                                    
                                            store: [
                                                '000','010','012','020','030',
                                                '040','041','050','051','060',
                                                '070','090'
                                            ],
                                            bind: {
                                                value: '{model.CONHECIMENTOS_CSTCSON}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10 0 10 10',
                            width: 270,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor Adiantado',
                                            reference: 'valoradiantado',
                                            proximoFoco: 'valorservico',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_ADIANTADO}'
                                            }
                                        },
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor Serviço',
                                            reference: 'valorservico',
                                            proximoFoco: 'valorreceber',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_SERVICOS}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor a Receber',
                                            reference: 'valorreceber',
                                            proximoFoco: 'valormercadoria',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_RECEBER}'
                                            }
                                        },
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor Mercadoria',
                                            reference: 'valormercadoria',
                                            proximoFoco: 'nota0',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.CONHECIMENTOS_MERCADORIA}'
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
                            reference: 'notas',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'CONHECIMENTOS_ITENS',
                            idProperty: 'CONHECIMENTOSITENS_ID',
                            descartarSeVazio: 'CONHECIMENTOSITENS_NUMERO',
                            bind: {
                                store: '{notas}'
                            },
                            listeners: {
                                aposPublicarModel: 'fazerSomas'
                            },
                            fields: [
                                { hidden: true, name: 'CONHECIMENTOSITENS_ID' },
                                {
                                    title: 'Nota',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    documento: 'Nota Eletrônica',
                                    valueStatus: 2,
                                    tabela: 'movimentos',
                                    proximoFoco: 'ser',
                                    pesquisaObrigatoria: false,
                                    pesquisaApenasJanela: true,
                                    permitirApenasNumeros: true,
                                    callbackFn: 'publicarModel',
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'CONHECIMENTOSITENS_NUMERO',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['CONHECIMENTOSITENS_NUMERO',        'MOVIMENTOS_NUMERO'],
                                        ['CONHECIMENTOSITENS_SERIE',         'MOVIMENTOS_SERIE'],
                                        ['CONHECIMENTOSITENS_NFE',           'MOVIMENTOS_NFE'],
                                        ['CONHECIMENTOSITENS_TOTAL',         'MOVIMENTOS_TOTAL'],
                                        ['CONHECIMENTOSITENS_EMISSAO',       'MOVIMENTOS_EMISSAO'],
                                        ['CONHECIMENTOSITENS_PESOLIQUIDO',   'MOVIMENTOSENVIO_PESOLIQUIDO']
                                    ]
                                },
                                {
                                    title: 'Ser',
                                    width: 50,
                                    xtype: 'textfield',
                                    name: 'CONHECIMENTOSITENS_SERIE',
                                    proximoFoco: 'codigodeBarras',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Código de Barras',
                                    flex: 1,
                                    xtype: 'textfield',
                                    proximoFoco: 'pesoLiquido',
                                    name: 'CONHECIMENTOSITENS_NFE',
                                    listeners: {
                                        keydown: 'extrairCodigoBarras'  
                                    },
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Peso Líquido',
                                    name: 'CONHECIMENTOSITENS_PESOLIQUIDO',
                                    empty: true,
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    proximoFoco: 'emissao',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Emissão',
                                    name: 'CONHECIMENTOSITENS_EMISSAO', 
                                    xtype: 'datefield',
                                    proximoFoco: 'total',
                                    width : 130,
                                    flex: false,
                                    align: 'center',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Total',
                                    name: 'CONHECIMENTOSITENS_TOTAL',
                                    empty: true,
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'nota[linhadebaixo]',
                                    bind: {
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
