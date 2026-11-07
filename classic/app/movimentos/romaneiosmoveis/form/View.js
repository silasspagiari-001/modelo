Ext.define('SamosAdmin.movimentos.romaneiosmoveis.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formromaneiosmoveis',

    title: 'Romaneio', 
 
    requires: [
        'SamosAdmin.movimentos.romaneiosmoveis.form.ViewModel',
        'SamosAdmin.movimentos.romaneiosmoveis.form.ViewController',
        'SamosAdmin.movimentos.romaneiosmoveis.form.baixar.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Pedidos',
        'Baixar',
        'Executar',
        'Reativar',
        'GerarTransfer'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    defaultFocus: 'combobox:editable:not([hidden]):not([disabled]):not([readOnly])',
    
    constructor: function (config) {
        const isEntrega = config.listName.match(/Entrega/);
        const isCD      = configs.getEmpresa().nome.match(/CD/);
        const tema      = configs.getTema();

        if(!this.leftbuttons.filter(btn => btn.match && btn.match('Imprimir')).length) {
            const impressao = configs.getMovimentos().impressaoRomaneio || [];

            if(!impressao[0] || impressao[0] != 'Imprimir') {
                this.leftbuttons.splice(6, 0 , 'Imprimir: ' + impressao.join(','));
            } else {
                this.leftbuttons.splice(6, 0 , 'Imprimir');
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
                                    fieldLabel: 'Pessoas',
                                    tabela: 'pessoas',
                                    reference: 'pessoa',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    callbackFn: 'focarAposPesquisa',
                                    associations: [
                                        ['PESSOAS_NOME',         'PESSOAS_NOME'],
                                        ['ROMANEIOS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['PESSOAS_CPFCNPJ',      'PESSOAS_CPFCNPJ'],
                                        ['CIDADES_NOME',         'CIDADES_NOME'],
                                        ['CIDADES_ESTADO',       'CIDADES_ESTADO'],
                                        ['PESSOAS_EMAIL',        'PESSOAS_EMAIL'],
                                        ['PESSOAS_TELEFONE',     'PESSOAS_TELEFONE'],
                                        ['PESSOAS_CELULAR',      'PESSOAS_CELULAR'],
                                        ['PESSOAS_FORMULA',      'PESSOAS_FORMULA'],
                                        ['PESSOAS_TIPO',         'PESSOAS_TIPO']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_ID_PESSOAS}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PESSOAS_FORMULA}'
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
                                    width: 160,
                                    fieldLabel: 'CPF/CNPJ',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_CPFCNPJ}'
                                    },
                                    listeners: {
                                        change: 'changeCpfCnpj'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) ____-____',
                                    flex: false,
                                    width: 135,
                                    reference: 'telefone',
                                    fieldLabel: 'Telefone',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_TELEFONE}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 135,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_EMISSAO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 80,
                                    reference: 'numero',
                                    fieldLabel: 'Número',
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right;color:red;',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 70,
                                    reference: 'serie',
                                    fieldStyle:'color:red',
                                    fieldLabel: 'Série',
                                    ui: 'field-readonly',
                                    readOnly: true,
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
                                    fieldLabel: 'Cidade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 55,
                                    reference: 'estado',
                                    fieldLabel: 'Estado',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}'
                                    }
                                },
                                {
                                    width: 160,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Local',
                                    reference: 'local',
                                    proximoFoco: 'numero0',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    hidden: !isEntrega,
                                    store: [
                                        ['U', 'Urbano'],
                                        ['S', 'Suburbano']
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ROMANEIOS_LOCAL}'
                                    },
                                    listeners: {
                                        change: 'setarUrbanoOuSuburbano'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    flex: false,
                                    width: 135,
                                    reference: 'celular',
                                    fieldLabel: 'Celular',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 135,
                                    flex: false,
                                    fieldLabel: 'Saída',
                                    reference: 'saida',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_SAIDA}'
                                    }
                                },
                                {
                                    width: 155,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', isEntrega ? 'Entregar'  : 'Montar' ],
                                        ['E', 'Executado'],
                                        ['F', 'Faturado'],
                                        ['R', 'Retirado']
                                    ],
                                    bind: {
                                        fieldStyle: '{isRetirado ? "color:purple": isExecutado ? "color:blue" : isFaturado ? "color:black" : "color:green"}',
                                        value: '{model.ROMANEIOS_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Usuário',
                                    tabela: 'usuarios',
                                    reference: 'usuario',
                                    proximoFoco: 'numero0',
                                    readOnly: true,
                                    naoFocarAposPesquisar: true,
                                    ui: 'field-readonly',                                   
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['USUARIOS_NOME',           'USUARIOS_NOME'],
                                        ['ROMANEIOS_ID_USUARIOS',   'USUARIOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.USUARIOS_NOME}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_ID_USUARIOS}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: isEntrega ? 295 : 460,
                                    reference: 'log',
                                    fieldLabel: 'Log',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_LOG}'
                                    }
                                },                                
                                {
                                    width: 160,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'numero0',
                                    displayField: 'field2',
                                    forceSelection: true,
                                    hidden: !isEntrega,
                                    store: [
                                        ['E', 'Entrega'],
                                        ['A', 'Abastecimento'],
                                        ['T', 'Troca']
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.ROMANEIOS_PLACA}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 274,
                                    reference: 'impressao',
                                    fieldLabel: 'Impressão',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_IMPRESSAO}'
                                    }
                                },
                                {
                                    width: 155,
                                    flex: false,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_HORA}'
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
                                    proximoFoco: 'numero0',
                                    bind: {
                                        hidden: '{isRomaneioStiloMoveis}',
                                        value: '{model.ROMANEIOS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textarea',
                                    flex: 1,
                                    height: 118,
                                    maxLength: 512,
                                    reference: 'observacoes',                                    
                                    bind: {                  
                                        hidden: '{!isRomaneioStiloMoveis}',
                                        value: '{model.ROMANEIOS_OBSERVACOES}',
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
                            width: configs.getClientName() == 'stilomoveis' ? 435 : 190,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'end'
                            },
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
                                                value: '{model.ROMANEIOS_FRETE}',
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
                                                value: '{model.CONTAGEM_ITENS}',
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 154,
                                            fieldLabel: 'Total',
                                            reference: 'total_romaneio',
                                            xtype: 'samoswidgets-textmoney',
                                            ui: 'field-readonly',
                                            readOnly: true,
                                            fieldStyle: 'color:blue',
                                            bind: {
                                                value: '{model.ROMANEIOS_TOTAL}'
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
                            reference: 'pedidos',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            descartarSeVazio: 'MOVIMENTOS_NUMERO',
                            janelaDetalhes: {
                                xtype: 'romaneiosmoveisitens',
                                ocultarBotao: '{!isMontagem}'
                            },
                            name: 'ROMANEIOS_ITENS',
                            idProperty: 'ROMANEIOSITENS_ID',
                            bind: {
                                store: '{pedidos}'
                            },
                            listeners: {
                                aposPublicarModel: 'calcularValorServico'
                            },
                            fields: [
                                {
                                    title: 'Numero',
                                    width: 95,                                        
                                    xtype: 'samoswidgets-textsearch',
                                    valueStatus: isEntrega ? 11 : 12,
                                    multiEmpresa: isEntrega && isCD ? true : false,
                                    tabela: 'movimentos',
                                    documento: 'Pedido/Abastecimento',
                                    proximoFoco: 'numero[linhadebaixo]',
                                    naoSairSeVazio: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'MOVIMENTOS_NUMERO',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['MOVIMENTOS_NUMERO',            'MOVIMENTOS_NUMERO'],
                                        ['ROMANEIOSITENS_ID_MOVIMENTOS', 'MOVIMENTOS_ID'],
                                        ['MOVIMENTOS_SERIE',             'MOVIMENTOS_SERIE'],
                                        ['MOVIMENTOS_ID_EMPRESAS',       'MOVIMENTOS_ID_EMPRESAS'],
                                        ['MOVIMENTOS_ID_PESSOAS',        'MOVIMENTOS_ID_PESSOAS'],
                                        ['MOVIMENTOS_NOME',              'MOVIMENTOS_NOME'],
                                        ['MOVIMENTOS_ENTRADASAIDA',      'MOVIMENTOS_ENTRADASAIDA'],
                                        ['CIDADES_NOME',                 'CIDADES_NOME'],
                                        ['CIDADES_ESTADO',               'CIDADES_ESTADO'],
                                        ['MOVIMENTOS_IMPOSTO',           'MOVIMENTOS_IMPOSTO'],
                                        ['MONTAGENS_VALOR',              'MONTAGENS_VALOR'],
                                        ['ROMANEIOSITENS_TOTAL',         'MONTAGENS_VALOR']
                                    ]
                                },
                                {
                                    title: 'Ser',
                                    name: 'MOVIMENTOS_SERIE', 
                                    fieldStyle: 'text-align:center;',
                                    flex: false,                                        
                                    width: 50,
                                    readOnly: true
                                },
                                {
                                    title: 'Filial',
                                    name: 'MOVIMENTOS_ID_EMPRESAS', 
                                    fieldStyle: 'text-align:center;',
                                    flex: false,                                        
                                    width: 50,
                                    readOnly: true
                                },
                                {
                                    title: 'Pessoa',
                                    name: 'MOVIMENTOS_ID_PESSOAS', 
                                    fieldStyle: 'text-align:right;',
                                    flex: false,                                        
                                    width: 85,
                                    readOnly: true
                                },
                                {
                                    title: 'Nome Pessoa',
                                    name: 'MOVIMENTOS_NOME',
                                    flex: 1,
                                    readOnly: true
                                },
                                {
                                    title: 'Cidade',
                                    name: 'CIDADES_NOME',
                                    width: 150,
                                    readOnly: true
                                },
                                {
                                    title: 'UF',
                                    name: 'CIDADES_ESTADO',
                                    fieldStyle: 'text-align:center;',
                                    width: 45,
                                    readOnly: true
                                },
                                {
                                    title: 'Agendamento',
                                    fieldStyle: 'text-align:center;',
                                    width: 105,
                                    name: 'MOVIMENTOS_ENTRADASAIDA',
                                    xtype: 'datefield',
                                    readOnly: true
                                },
                                {
                                    title: 'Partida',
                                    name: 'MOVIMENTOS_IMPOSTO',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    readOnly: true
                                },
                                {
                                    hidden: (isEntrega ? true : false),
                                    title: 'Montagem',
                                    name: 'ROMANEIOSITENS_TOTAL',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    readOnly: true
                                },
                                { hidden: true, name: 'ROMANEIOSITENS_ID' },
                                { hidden: true, name: 'ROMANEIOSITENS_ID_ROMANEIOS' },
                                { hidden: true, name: 'ROMANEIOSITENS_ID_MOVIMENTOS' },
                                { hidden: true, name: 'ROMANEIOSITENS_ID_ITEM' },
                                { hidden: true, name: 'ROMANEIOSITENS_QUANTIDADE' },
                                { hidden: true, name: 'MONTAGENS_VALOR' },
                                { hidden: true, name: 'ROMANEIOSITENS_STATUS' }
                            ]
                        }                        
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
