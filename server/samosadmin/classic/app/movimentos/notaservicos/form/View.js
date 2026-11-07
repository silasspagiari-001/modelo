Ext.define('SamosAdmin.movimentos.notaservicos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formnotaservicos',

    requires: [
        'SamosAdmin.movimentos.notaservicos.form.ViewModel',
        'SamosAdmin.movimentos.notaservicos.form.ViewController',
        'SamosAdmin.movimentos.notaservicos.form.recuperacao.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Caixa',
        'Pagamento',
        'Liberar',
        {
            type: 'file',
            accept: '.xml',
            hidden: true,
            action: 'CarregarXML'
        },
        'Importar: De XML, De Ordem Serviço',
        'Sefaz',
        'Imprimir',        
        'Opções: Alterar Emissão, Alterar Vendedor'
    ],

    rightbuttons: [
        'Fechar',        
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function (config) {
        const tema = configs.getTema();

        Ext.apply(this, {
            title: 'Nota Serviço',
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
                                        value: '{model.ORDENS_NOME}',
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
                                        ['ORDENS_NOME',       'PESSOAS_NOME'],
                                        ['ORDENS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['ORDENS_CPFCNPJ',    'PESSOAS_CPFCNPJ'],
                                        ['PESSOAS_CPFCNPJ',       'PESSOAS_CPFCNPJ'],                        
                                        ['CIDADES_NOME',          'CIDADES_NOME'],
                                        ['CIDADES_ESTADO',        'CIDADES_ESTADO'],                                        
                                        ['PESSOAS_FANTASIA',      'PESSOAS_FANTASIA'],
                                        ['ORDENS_EMAIL',      'PESSOAS_EMAIL'],
                                        ['PESSOAS_TELEFONE',      'PESSOAS_TELEFONE'],
                                        ['ORDENS_CELULAR',    'PESSOAS_CELULAR'],
                                        ['PESSOAS_ENDERECO',      'PESSOAS_ENDERECO'],
                                        ['PESSOAS_NUMERO',        'PESSOAS_NUMERO'],
                                        ['PESSOAS_BAIRRO',        'PESSOAS_BAIRRO'],
                                        ['PESSOAS_CEP',           'PESSOAS_CEP'],
                                        ['PESSOAS_ID_CIDADES',    'PESSOAS_ID_CIDADES'],
                                        ['PESSOAS_CREDITO',       'PESSOAS_CREDITO'],
                                        ['PESSOAS_STATUS',        'PESSOAS_STATUS'],
                                        ['PESSOAS_TIPO',          'PESSOAS_TIPO'],
                                        ['PESSOAS_PAGINA',        'PESSOAS_PAGINA'],
                                        ['PESSOAS_INSCRICAO',     'PESSOAS_INSCRICAO'],
                                        ['PESSOAS_OBSERVACOES',   'PESSOAS_OBSERVACOES'],
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
                                        value: '{model.ORDENS_CPFCNPJ}'
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
                                        value: '{model.ORDENS_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 130,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'email',
                                    bind: {
                                        value: '{model.ORDENS_EMISSAO}',
                                        readOnly: '{readOnly}'                                        
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
                                        value: '{model.ORDENS_SERIE}'
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
                                        value: '{model.ORDENS_FECHAMENTO}'
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
                                    tabela: 'cidades',
                                    reference: 'cidadeprestacao',
                                    proximoFoco: 'rsdescontos',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    fieldLabel: 'Local da Prestação',
                                    bind: {
                                        associations: '{prestacaoAssociations}',
                                        readOnly: '{readOnly}',
                                        value: '{model.CIDADES_NOMEPRESTACAO}'
                                    }
                                },
                                {
                                    width: 45,
                                    fieldLabel: 'Estado',
                                    reference: 'estadoprestacao',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_ESTADOPRESTACAO}'
                                    }
                                },
                                {
                                    width: 366,
                                    fieldLabel: 'Cidade Incidência ISS',
                                    fieldStyle: 'color:blue',
                                    ui: 'field-readonly',
                                    readOnly: true,                                    
                                    bind: {
                                        value: '{model.CIDADES_NOMEINCIDENCIA}'
                                    }
                                },
                                {
                                    width: 45,
                                    fieldLabel: 'Estado',
                                    fieldStyle: 'color:blue',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_ESTADOINCIDENCIA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora Emi',
                                    reference: 'hora',
                                    proximoFoco: 'numeroorigem',
                                    maxLength: 8,
                                    width: 130,
                                    bind: {
                                        value: '{model.ORDENS_HORAEMISSAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 115,//65
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
                                    fieldLabel: 'Origem',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.ORDENS_NUMEROORIGEM}'
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
                {
                    title: 'Observações',
                    ui: 'formpanel-noheader-' + tema,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 10 10 10', // 10 0 10 10
                            padding: '10 10 10 10',
                            height: 118,
                            width: window.innerWidth - 1090, //1010
                            layout: 'fit',
                            items: [
                                {
                                    xtype: 'samoswidgets-textlist',
                                    flex: 1,
                                    height: 118,
                                    lines: 9,
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
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 10 10 0', 
                            padding: '10 10 10 10',
                            defaultType: 'fieldcontainer',
                            width: 395, // 400
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
                                            fieldLabel: 'Chave NFS-e',
                                            reference: 'chavesat',
                                            proximoFoco: 'protocolo',
                                            bind: {
                                                value: '{model.ORDENS_NFE}',
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
                                                value: '{model.ORDENS_PROTOCOLO}',
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
                                                added: function(campo, evento){
                                                    const formAdded = Ext.$('formnotaservicos')[0];
                                                    const modelAdded = formAdded.model;
                                                    
                                                    formAdded.getController().atualizarLog(modelAdded);
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 10 10 0',
                            padding: '10 10 10 10',
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
                                            width: 102,
                                            fieldLabel: 'R$ ISS',
                                            reference: 'rsiss',
                                            xtype: 'samoswidgets-textmoney',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.ORDENS_VALORISS}'
                                            }
                                        },
                                        {
                                            width: 102,
                                            fieldLabel: 'R$ IRRF',
                                            reference: 'rsirrf',
                                            xtype: 'samoswidgets-textmoney',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.ORDENS_VALORIRRF}'
                                            }
                                        },
                                        {
                                            width: 102,
                                            fieldLabel: 'R$ INSS',
                                            reference: 'rsinss',
                                            xtype: 'samoswidgets-textmoney',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.ORDENS_VALORINSS}'
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
                                            width: 102,
                                            fieldLabel: 'Serviços',
                                            reference: 'servicos_valor',
                                            proximoFoco: 'total',
                                            xtype: 'samoswidgets-textmoney',
                                            fieldStyle: 'color:green',
                                            readOnly: true,
                                            ui: 'field-readonly',
                                            bind: {
                                                value: '{model.ORDENS_SERVICOS}'
                                            }
                                        },
                                        {
                                            width: 102,
                                            fieldLabel: 'R$ Descontos',
                                            reference: 'rsdescontos',
                                            xtype: 'samoswidgets-textmoney',
                                            proximoFoco: 'produtos',
                                            bind: {
                                                value: '{model.ORDENS_DESCONTOS}',
                                                readOnly: '{readOnly || isDescontoPorItem || digitouDescontoCabecalhoEmPercentual || (isDescontoPorItemECabecalho && digitouDescontoItem)}',
                                                ui: '{readOnly ? "field-readonly" : "textbold-' + tema + '"}'
                                            },
                                            listeners: {
                                                change: 'fazerSomasERateios',
                                                render: 'onUpdateField'
                                            }
                                        },
                                        {
                                            width: 102,
                                            fieldLabel: 'Total',
                                            reference: 'total',
                                            xtype: 'samoswidgets-textmoney',
                                            fieldStyle: 'color:blue',
                                            proximoFoco: 'servico0',
                                            readOnly: true,
                                            ui: 'field-readonly',
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
                // novo bloco
                {
                    title: 'Operação',
                    ui: 'formpanel-noheader-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    width: 100,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Operação',
                                    tabela: 'operacoes',
                                    reference: 'operacaoservico',
                                    proximoFoco: 'nfe',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['ORDENS_ID_OPERACOES', 'OPERACOES_ID'],
                                        ['OPERACOES_NOME',      'OPERACOES_NOME'],
                                        ['OPERACOES_FINANCEIRO','OPERACOES_FINANCEIRO'],
                                        ['OPERACOES_FINALIDADE','OPERACOES_FINALIDADE'],
                                        ['OPERACOES_TIPO',      'OPERACOES_TIPO'],
                                        ['OPERACOES_ACAO',      'OPERACOES_ACAO'],
                                        ['OPERACOES_BAIXAVISTA','OPERACOES_BAIXAVISTA'],
                                        ['OPERACOES_ID_APLICACOES', 'OPERACOES_ID_APLICACOES'],
                                        ['OPERACOES_UNICA',         'OPERACOES_UNICA'],
                                        ['OPERACOES_COMPLEMENTAR',  'OPERACOES_COMPLEMENTAR']
                                    ],
                                    bind: {
                                        value: '{model.ORDENS_ID_OPERACOES}',
                                        readOnly: '{readOnly}'
                                    }                                    
                                },
                                {
                                    flex: 1,
                                    reference: 'nomeoperacaoservico',
                                    proximoFoco: 'valordeducoes',
                                    fieldLabel: 'Descrição',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.OPERACOES_NOME}'
                                    }
                                },
                                // novos campos
                                {          
                                    width: 116,                                  
                                    flex: false,                                    
                                    xtype: 'combobox',
                                    fieldLabel: 'ISS Retido',
                                    reference: 'impostoretido',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.ORDENS_ISSRETIDO}',
                                        readOnly: '{readOnly}',                                        
                                        store: [
                                            ["R", "Sim"],
                                            ["N", "Não"]
                                        ]
                                    },
                                    listeners: {
                                        change: 'forcarRecalculo'
                                    }    
                                },

                                {
                                    width: 116, // 102
                                    flex: false,
                                    fieldLabel: 'Valor Deduções',
                                    reference: 'valordeducoes',
                                    proximoFoco: 'valorretencoes',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        ui: 'textbold-' + tema,
                                        value: '{model.ORDENS_VALORDEDUCOES}'
                                    }

                                },
                                {
                                    width: 116,
                                    flex: false,
                                    fieldLabel: 'Valor Retenções',
                                    reference: 'valorretencoes',
                                    proximoFoco: 'aliqiss',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'textbold-' + tema,                                    
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENS_VALORRETENCOES}'
                                    },
                                    listeners: {
                                        change: 'fazerSomasERateios'
                                    }
                                },

// fim dos novos campos
                                {
                                    width: 116,
                                    flex: false,
                                    fieldLabel: 'Alíquota ISS',
                                    reference: 'aliqiss',
                                    proximoFoco: 'aliqirrf',
                                    fieldStyle:'color:blue',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        ui: 'textbold-' + tema,
                                        value: '{model.ORDENS_ALIQUOTAISS}'
                                    },
                                    listeners: {
                                        change: 'fazerSomasERateios'
                                    }
                                },
                                {
                                    width: 116,
                                    flex: false,
                                    fieldLabel: 'Alíquota IRRF',
                                    reference: 'aliqirrf',
                                    proximoFoco: 'valoricms',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'textbold-' + tema,                                    
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENS_ALIQUOTAIRRF}'
                                    }

                                },
                                {
                                    width: 118,
                                    flex: false,
                                    fieldLabel: 'Alíquota INSS',
                                    reference: 'aliqinss',
                                    xtype: 'samoswidgets-textmoney',
                                    ui: 'textbold-' + tema,                                    
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ORDENS_ALIQUOTAINSS}'
                                    },
                                    listeners: {
                                        change: 'fazerSomasERateios',
                                        render: 'onUpdateField'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {                                            
                                    xtype: 'combobox',
                                    fieldLabel: 'Atividade CNAE',
                                    flex: 1,
                                    reference: 'atividadecnae',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.ORDENS_TRIBUTACAO}',
                                        store: configs.getMovimentos().cnaeServicos,
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {                                            
                                    xtype: 'combobox',
                                    fieldLabel: 'Atividade Municipal',
                                    flex: 1,
                                    reference: 'atividademun',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false, 
                                    listeners: {
                                        change: 'onAtividadeMunicipalChange'
                                    },
                                    bind: {
                                        value: '{model.ORDENS_CODIGOSERVICO}',
                                        store: configs.getMovimentos().tabelaServicos,
                                        readOnly: '{readOnly}'
                                    }    
                                }
                            ]
                        }
                    ]
                },
                // fim do novo bloco
                {
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems', // ajustar grid
                            reference: 'servicos',
                            qtdeLinhasMinima: 3,
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
                                    title: 'Serviço',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: configs.getClientName() == 'eleve' ? 'veiculos' : 'servicos',
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
                                        ['ORDENSSERVICOS_DESCRITIVO',  'DESCRITIVO_SERVICO'],
                                        ['SERVICOS_NOME',              'SERVICOS_NOME'],
                                        ['ORDENSSERVICOS_PRECO',       'SERVICOS_PRECO'],
                                        ['SERVICOS_PRECO',             'SERVICOS_PRECO'],
                                        ['ORDENSSERVICOS_ISS',         'SERVICOS_ISS']
                                    ]
                                },
                                {
                                    title: 'Descrição do serviço',
                                    reference: 'nomedoServico',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: configs.getClientName() == 'eleve' ? 'ORDENSSERVICOS_DESCRITIVO' : 'SERVICOS_NOME',
                                    maxLength: 100,                                    
                                    proximoFoco: 'qtde',                                    
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Qtde',
                                    name: 'ORDENSSERVICOS_QUANTIDADE',
                                    xtype: 'numberfield',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    proximoFoco: 'precoservico',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    width: 60,
                                    bind: {    
                                        readOnly: '{readOnly}',
                                        proximoFoco: `{
                                            permitidoAlterarPreco ? 
                                            "precoservico" : 
                                            "servico[linhadebaixo]"
                                        }`,
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
                                    width: 110,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    readOnly: true,
                                    proximoFoco: 'servico[linhadebaixo]'
                                },
                                { hidden: true, name: 'ORDENSSERVICOS_ISS' },
                                { hidden: true, name: 'ORDENSSERVICOS_BASEISS' }
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
