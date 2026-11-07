Ext.define('SamosAdmin.movimentos.manifestos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formmanifestos',

    requires: [
        'SamosAdmin.movimentos.manifestos.form.ViewModel',
        'SamosAdmin.movimentos.manifestos.form.ViewController'
    ],

    title: 'Manifesto',

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
                                    flex: false,
                                    width: 115,
                                    xtype: 'samoswidgets-textsearch',
                                    naoFocarAposPesquisar: true,                                    
                                    fieldLabel: 'Busca Placa',
                                    tabela: 'cargas',
                                    reference: 'placabusca',
                                    proximoFoco: 'freteporconta',
                                    buscarPor: 'placa', // 'Genérica'
                                    associations: [ 
                                        ['CARGAS_ID',                 'CARGAS_ID'],
                                        ['MANIFESTOS_PLACAVEICULO',   'CARGAS_PLACAVEICULO'],
                                        ['MANIFESTOS_TIPOFRETE',      'CARGAS_TIPOFRETE'],
                                        ['MANIFESTOS_TIPOVEICULO',    'CARGAS_TIPOVEICULO'],
                                        ['MANIFESTOS_TIPOCARROCERIA', 'CARGAS_TIPOCARROCERIA'],
                                        ['MANIFESTOS_TIPOCARGA',      'CARGAS_TIPOCARGA'],
                                        ['MANIFESTOS_TIPOEMITENTE',   'CARGAS_TIPOEMITENTE'],
                                        ['MANIFESTOS_RENAVAN',        'CARGAS_RENAVAN'],
                                        ['MANIFESTOS_RNTC',           'CARGAS_RNTC'],
                                        ['MANIFESTOS_CIOT',           'CARGAS_CIOT'],
                                        ['MANIFESTOS_PLACAUFVEICULO', 'CARGAS_PLACAUFVEICULO'],
                                        ['MANIFESTOS_TARAVEICULO',    'CARGAS_TARAVEICULO'],
                                        ['MANIFESTOS_CARGAVEICULO',   'CARGAS_CARGAVEICULO'],
                                        ['MANIFESTOS_TAMANHOVEICULO', 'CARGAS_TAMANHOVEICULO'],
                                        ['MANIFESTOS_PLACAREBOQUE',   'CARGAS_PLACAREBOQUE'],
                                        ['MANIFESTOS_PLACAREBOQUEUF', 'CARGAS_PLACAREBOQUEUF'],
                                        ['MANIFESTOS_TARAREBOQUE',    'CARGAS_TARAREBOQUE'],
                                        ['MANIFESTOS_CARGAREBOQUE',   'CARGAS_CARGAREBOQUE'],
                                        ['MANIFESTOS_TAMANHOREBOQUE', 'CARGAS_TAMANHOREBOQUE'],
                                        ['MANIFESTOS_PERCURSOINICIAL','CARGAS_PERCURSOINICIAL'],
                                        ['MANIFESTOS_PERCURSOFINAL',  'CARGAS_PERCURSOFINAL'],
                                        ['MANIFESTOS_ID_CARREGAMENTO','CARGAS_ID_CARREGAMENTO'],
                                        ['CIDADES_IBGECARREGA',       'CARGAS_CIDADESIBGE'],
                                        ['CIDADES_NOMECARREGA',       'CARGAS_CIDADESNOME'],
                                        ['CIDADES_ESTADOCARREGA',     'CARGAS_CIDADESESTADO'],
                                        ['MANIFESTOS_SEGURADORA',     'CARGAS_SEGURADORA'],
                                        ['MANIFESTOS_CPFCNPJ',        'CARGAS_CPFCNPJ'],
                                        ['MANIFESTOS_APOLICE',        'CARGAS_APOLICE'],
                                        ['MANIFESTOS_AVERBACAO',      'CARGAS_AVERBACAO'],
                                        ['MANIFESTOS_CONTRATANTE',    'CARGAS_CONTRATANTE'],
                                        ['MANIFESTOS_EMAIL',          'CARGAS_EMAIL'],
                                        ['MANIFESTOS_PREDOMINANTE',   'CARGAS_PREDOMINANTE'],
                                        ['MANIFESTOS_NCM',            'CARGAS_NCM'],
                                        ['MANIFESTOS_CEPORIGEM',      'CARGAS_CEPORIGEM'],
                                        ['MANIFESTOS_CEPDESTINO',     'CARGAS_CEPDESTINO'],
                                        ['MANIFESTOS_TRANSPCPFCNPJ',  'CARGAS_TRANSPCPFCNPJ'],
                                        ['MANIFESTOS_TRANSPNOME',     'CARGAS_TRANSPNOME']
                                    ],
                                    bind: {
                                        value: '{model.CARGAS_ID}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 101,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Busca Pessoa',
                                    tabela: 'pessoas',
                                    reference: 'pessoabusca',
                                    proximoFoco: 'freteporconta',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['PESSOAS_ID', 'PESSOAS_ID'],                                        
                                        ['MANIFESTOS_TRANSPNOME',     'PESSOAS_NOME'],
                                        ['MANIFESTOS_TRANSPCPFCNPJ',  'PESSOAS_CPFCNPJ'],
                                        ['MANIFESTOS_CEPDESTINO',     'PESSOAS_CEPDESTINO']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_BUSCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 101,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Busca Transpor',
                                    tabela: 'transportes',
                                    reference: 'transporte',
                                    proximoFoco: 'freteporconta',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['MANIFESTOS_ID_TRANSPORTES', 'TRANSPORTES_ID'],
                                        ['MANIFESTOS_TRANSPNOME',     'TRANSPORTES_NOME'],
                                        ['MANIFESTOS_TRANSPCPFCNPJ',  'TRANSPORTES_CPFCNPJ']
                                    ],
                                    bind: {
                                        value: '{model.TRANSPORTES_BUSCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    flex: 1,
                                    fieldLabel: 'Nome Transportador',
                                    reference: 'nome',
                                    maxLength: 50,
                                    proximoFoco: 'cpfcnpj',                                    
                                    bind: {
                                        value: '{model.MANIFESTOS_TRANSPNOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    reference: 'cpfcnpj',
                                    fieldLabel: 'Cpf/Cnpj',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    flex: false,
                                    width: 165,
                                    proximoFoco: 'placa',
                                    bind: {
                                        value: '{model.MANIFESTOS_TRANSPCPFCNPJ}',
                                        readOnly: '{readOnly}'                                        
                                    }
                                },
                                {
                                    fieldLabel: 'Frete por Conta',
                                    flex: false,
                                    width: 145,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'freteporconta',
                                    proximoFoco: 'tipoveiculo',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['E', 'Emitente'],
                                        ['D', 'Destinatário']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_TIPOFRETE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Número',
                                    flex: false,
                                    width: 75,
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
                                    fieldLabel: 'Série',
                                    flex: false,
                                    width: 60,
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
                                    fieldLabel: 'Placa',
                                    xtype: 'samoswidgets-textupper',
                                    width: 115,
                                    flex: false,
                                    maxLength: 8,
                                    reference: 'placa',
                                    proximoFoco: 'placauf',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_PLACAVEICULO}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 45,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'placauf',
                                    proximoFoco: 'tipocarroceria',
                                    emptyText: '',
                                    forceSelection: true,
                                    hideTrigger: true,
                                    store: Object.keys(SamosUtils.Info.getEstados()),
                                    bind: {
                                        value: '{model.MANIFESTOS_PLACAUFVEICULO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Tipo Veículo',
                                    flex: false,
                                    width: 157,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tipoveiculo',
                                    proximoFoco: 'placa',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['K', 'Truck'],
                                        ['T', 'Toco'],
                                        ['C', 'Cavalo Mecânico'],
                                        ['V', 'Van'],
                                        ['U', 'Utilitário'],
                                        ['O', 'Outros']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_TIPOVEICULO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Tipo Carroceria',
                                    flex: false,
                                    width: 155,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tipocarroceria',
                                    proximoFoco: 'tipocarga',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['A', 'Aberta'],
                                        ['F', 'Fechada'],
                                        ['G', 'Graneleira'],
                                        ['P', 'Porta Container'],
                                        ['S', 'Sider']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_TIPOCARROCERIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Resp. Carga',
                                    flex: false,
                                    width: 165,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tipocarga',
                                    proximoFoco: 'tipoemitente',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['E', 'Emitente'],
                                        ['T', 'Tomador']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_TIPOCARGA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Tipo de Emitente',
                                    flex: false,
                                    width: 160,
                                    xtype: 'combobox',
                                    editable: false,                                    
                                    reference: 'tipoemitente',
                                    proximoFoco: 'emissao',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        ['P', 'Prestador'],
                                        ['N', 'Não Prestador'],
                                        ['T', 'Transportadora']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_TIPOEMITENTE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    flex: false,
                                    width: 90,
                                    reference: 'hora',
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MANIFESTOS_HORA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Emissão',
                                    xtype: 'datefield',
                                    width: 145,
                                    flex: false,
                                    reference: 'emissao',
                                    proximoFoco: 'placacarreta',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_EMISSAO}'
                                    }
                                },                                
                                {
                                    fieldLabel: 'Saída',
                                    xtype: 'datefield',
                                    width: 140,
                                    flex: false,
                                    reference: 'saida',
                                    proximoFoco: 'taratracao',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.MANIFESTOS_SAIDA}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Placa Carreta',
                                    xtype: 'samoswidgets-textupper',
                                    width: 115,
                                    flex: false,
                                    maxLength: 8,
                                    reference: 'placacarreta',
                                    proximoFoco: 'placacarretauf',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_PLACAREBOQUE}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    width: 45,
                                    flex: false,
                                    maxLength: 2,
                                    xtype: 'samoswidgets-textupper',
                                    reference: 'placacarretauf',
                                    proximoFoco: 'renavam',
                                    bind: {
                                        value: '{model.MANIFESTOS_PLACAREBOQUEUF}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'RENAVAM',
                                    flex: 1,
                                    reference: 'renavam',
                                    proximoFoco: 'rntc',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_RENAVAN}'
                                    }
                                },
                                {
                                    fieldLabel: 'RNTC',
                                    flex: false,
                                    width: 165,
                                    reference: 'rntc',
                                    proximoFoco: 'ciot',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_RNTC}'
                                    }
                                },
                                {
                                    fieldLabel: 'CIOT',
                                    flex: false,
                                    width: 160,
                                    reference: 'ciot',
                                    proximoFoco: 'taratracao',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_CIOT}'
                                    }
                                },
                                {
                                    fieldLabel: 'Log',
                                    width: 240,
                                    flex: false,
                                    reference: 'log',
                                    proximoFoco: 'rsdescontos',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MANIFESTOS_LOG}'
                                    }
                                },
                                {
                                    fieldLabel: 'Status',
                                    width: 140,
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
                                        ['R', 'Encerrado'],
                                        ['C', 'Cancelado'],
                                    ],
                                    bind: {
                                        fieldStyle: '{isCancelado ? "color:red" : (isEnviado || isEncerrado) ? "color:black" : "color:green"}',
                                        value: '{model.MANIFESTOS_STATUS}'
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
                    title: 'Veículos',
                    ui: 'formpanel-noheader-' + tema,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10 0 10 10',
                            width: 287,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    xtype: 'container',
                                    html: 'Veículo Tração',
                                    margin: '0 0 10 0',
                                    style: {
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            fieldLabel: 'Tara',
                                            flex: false,
                                            width: 90,
                                            reference: 'taratracao',
                                            proximoFoco: 'kgtracao',
                                            mask: '#9.999.990,000',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MANIFESTOS_TARAVEICULO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            fieldLabel: 'Cap. Kg',
                                            flex: false,
                                            width: 90,
                                            reference: 'kgtracao',
                                            proximoFoco: 'captracao',
                                            mask: '#9.999.990,000',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MANIFESTOS_CARGAVEICULO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            fieldLabel: 'Cap. M³',
                                            flex: false,
                                            width: 75,
                                            reference: 'captracao',
                                            proximoFoco: 'tarareboque',
                                            mask: '#9.999.990,000',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MANIFESTOS_TAMANHOVEICULO}',
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
                            width: 287,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    xtype: 'container',
                                    html: 'Veículo Reboque',
                                    margin: '0 0 10 0',
                                    style: {
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            fieldLabel: 'Tara',
                                            flex: false,
                                            width: 90,
                                            reference: 'tarareboque',
                                            proximoFoco: 'kgreboque',
                                            mask: '#9.999.990,000',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MANIFESTOS_TARAREBOQUE}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            fieldLabel: 'Cap. Kg',
                                            flex: false,
                                            width: 90,
                                            reference: 'kgreboque',
                                            proximoFoco: 'capreboque',
                                            mask: '#9.999.990,000',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MANIFESTOS_CARGAREBOQUE}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            fieldLabel: 'Cap. M³',
                                            flex: false,
                                            width: 75,
                                            reference: 'capreboque',
                                            proximoFoco: 'ufinicial',
                                            mask: '#9.999.990,000',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.MANIFESTOS_TAMANHOREBOQUE}',
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
                            flex: 1,
                            defaultType: 'fieldcontainer',
                            layout: {
                                type: 'vbox',
                                align: 'stretch'
                            },
                            items: [
                                {
                                    xtype: 'container',
                                    html: 'Percurso do Estado',
                                    margin: '0 0 10 0',
                                    style: {
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            fieldLabel: 'UF Inicial',
                                            width: 60,
                                            flex: false,
                                            xtype: 'combobox',
                                            reference: 'ufinicial',
                                            proximoFoco: 'uffinal',
                                            emptyText: '',
                                            forceSelection: true,
                                            hideTrigger: true,
                                            store: Object.keys(SamosUtils.Info.getEstados()),
                                            bind: {
                                                value: '{model.MANIFESTOS_PERCURSOINICIAL}',
                                                readOnly: '{readOnly}'
                                            },
                                            listeners: {
                                                change: 'filtrarEstadosAPercorrer'
                                            }                                            
                                        },
                                        {
                                            fieldLabel: 'UF Final',
                                            width: 60,
                                            flex: false,
                                            xtype: 'combobox',
                                            reference: 'uffinal',
                                            proximoFoco: 'apercorrer',
                                            emptyText: '',
                                            forceSelection: true,
                                            hideTrigger: true,
                                            store: Object.keys(SamosUtils.Info.getEstados()),
                                            bind: {
                                                value: '{model.MANIFESTOS_PERCURSOFINAL}',
                                                readOnly: '{readOnly}'
                                            },
                                            listeners: {
                                                change: 'filtrarEstadosAPercorrer'
                                            }                                            
                                        },
                                        {
                                            xtype: 'tagfield',
                                            flex: 1,
                                            fieldLabel: 'A Percorrer (Estados)',
                                            reference: 'apercorrer',
                                            proximoFoco: 'qtdenfe',
                                            maxLength: 20,
                                            ui: 'default',
                                            emptyText: '',
                                            encodeSubmitValue: true,
                                            store: Object.keys(SamosUtils.Info.getEstados()),
                                            collapseOnSelect: true,
                                            filterPickList: true,
                                            queryMode: 'local', 
                                            publishes: 'value',        
                                            bind: {
                                                value: '{model.MANIFESTOS_ESTADOS}',
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
                    title: 'Impostos',
                    ui: 'formpanel-noheader-' + tema,
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10 0 10 10',
                            flex: 1,
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
                                            flex: 1,
                                            fieldLabel: 'Qtde NFe-@',
                                            reference: 'qtdenfe',
                                            proximoFoco: 'qtdect',
                                            fieldStyle: 'color:blue;text-align:right;',
                                            xtype: 'numberfield',
                                            hideTrigger: true,
                                            minValue: 0,
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_QUANTIDADENFE}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            flex: 1,
                                            fieldLabel: 'Qtde CT-@',
                                            reference: 'qtdect',
                                            proximoFoco: 'baseicms',
                                            fieldStyle: 'color:red;text-align:right;',
                                            xtype: 'numberfield',
                                            hideTrigger: true,
                                            minValue: 0,
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_QUANTIDADECFE}'
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
                            width: 390,
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
                                            fieldLabel: 'Base ICMS',
                                            reference: 'baseicms',
                                            proximoFoco: 'basesubstituicao',
                                            fieldStyle: 'color:blue',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_BASEICMS}'
                                            }
                                        },
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Base Substituição',
                                            reference: 'basesubstituicao',
                                            proximoFoco: 'valoripi',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_BASESUBST}'
                                            }
                                        },
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor IPI',
                                            reference: 'valoripi',
                                            proximoFoco: 'valoricms',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_IPI}'
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
                                            fieldLabel: 'Valor ICMS',
                                            reference: 'valoricms',
                                            fieldStyle: 'color:red',
                                            proximoFoco: 'valorsubstituicao',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_VALORICMS}'
                                            }
                                        },
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor Substituição',
                                            reference: 'valorsubstituicao',
                                            proximoFoco: 'valoribpt',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_VALORSUBST}'
                                            }
                                        },
                                        {
                                            width: 120,
                                            flex: false,
                                            fieldLabel: 'Valor IBPT',
                                            reference: 'valoribpt',
                                            proximoFoco: 'pesobruto',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_IBPT}'
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
                            flex: 4,
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
                                            flex: 1,
                                            fieldLabel: 'Peso Bruto',
                                            reference: 'pesobruto',
                                            proximoFoco: 'frete',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_PESOBRUTO}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Frete',
                                            reference: 'frete',
                                            proximoFoco: 'servicos',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_FRETE}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Serviços',
                                            reference: 'servicos',
                                            proximoFoco: 'produtos',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_SERVICOS}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Produtos',
                                            reference: 'produtos',
                                            proximoFoco: 'pesoliquido',
                                            fieldStyle: 'color: green',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_PRODUTOS}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    layout: 'hbox',
                                    items: [
                                        {
                                            flex: 1,
                                            fieldLabel: 'Peso Líquido',
                                            reference: 'pesoliquido',
                                            proximoFoco: 'seguro',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_PESOLIQUIDO}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Seguro',
                                            reference: 'seguro',
                                            proximoFoco: 'desconto',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_SEGURO}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Desconto',
                                            reference: 'desconto',
                                            proximoFoco: 'total',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_DESCONTOS}'
                                            }
                                        },
                                        {
                                            flex: 1,
                                            fieldLabel: 'Total',
                                            reference: 'total',
                                            proximoFoco: 'seguradora',
                                            fieldStyle: 'color: blue',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                readOnly: '{readOnly}',
                                                value: '{model.MANIFESTOS_TOTAL}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Protocolo',
                    ui: 'formpanel-noheader-' + tema,
                    items: [
                        {
                            items: [
                                {
                                    fieldLabel: 'Seguradora',
                                    flex: false,
                                    width: 250,
                                    reference: 'seguradora',
                                    proximoFoco: 'apolice',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_SEGURADORA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Nº Apólice',
                                    flex: false,
                                    width: 105,
                                    reference: 'apolice',
                                    proximoFoco: 'averbacao',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_APOLICE}'
                                    }
                                },
                                {
                                    fieldLabel: 'Nº Averbação',
                                    flex: false,
                                    width: 125,
                                    reference: 'averbacao',
                                    proximoFoco: 'cnpjseguradora',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_AVERBACAO}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    fieldLabel: 'CNPJ Seguradora',
                                    textMask: '__.___.___/____-__',
                                    reference: 'cnpjseguradora',
                                    proximoFoco: 'predominante',
                                    flex: false,
                                    width: 200,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_CONTRATANTE}'
                                    }
                                },
                                {
                                    fieldLabel: 'Código de Barras',
                                    flex: 1,
                                    reference: 'codigobarras',
                                    proximoFoco: 'protocolo',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MANIFESTOS_NFE}'
                                    }
                                }
                            ]
                        },
                        // nova linha
                        {
                            items: [
                                {
                                    fieldLabel: 'Produto Predominante',
                                    flex: false,
                                    width: 250,
                                    reference: 'predominante',
                                    maxLength: 50,
                                    proximoFoco: 'ncmproduto',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_PREDOMINANTE}'
                                    }
                                },
                                {
                                    fieldLabel: 'NCM Produto',
                                    flex: false,
                                    width: 105,
                                    reference: 'ncmproduto',
                                    maxLength: 10,
                                    proximoFoco: 'carregamento',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.MANIFESTOS_NCM}'
                                    }
                                },
                                {
                                    width: 125,
                                    flex: false,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Carregamento',
                                    tabela: 'cidades',
                                    reference: 'carregamento',
                                    proximoFoco: 'cepcarga',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['CIDADES_IBGECARREGA',        'CIDADES_IBGE'],
                                        ['MANIFESTOS_ID_CARREGAMENTO', 'CIDADES_ID'],
                                        ['CIDADES_NOMECARREGA',        'CIDADES_NOME'],
                                        ['CIDADES_ESTADOCARREGA',      'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.CIDADES_IBGECARREGA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.MANIFESTOS_ID_CARREGAMENTO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Município carregamento',
                                    flex: false,
                                    width: 200,
                                    reference: 'municipio',
                                    proximoFoco: 'ufcarregamento',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_NOMECARREGA}'
                                    }
                                },
                                {
                                    fieldLabel: 'UF',
                                    flex: false,
                                    width: 40,
                                    reference: 'ufcarregamento',
                                    proximoFoco: 'estado',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_ESTADOCARREGA}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    width: 120,
                                    fieldLabel: 'CEP Carregamento',
                                    reference: 'cepcarga',
                                    naoFocarAposPesquisar: true,
                                    proximoFoco: 'cepdescarga',
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['MANIFESTOS_CEPORIGEM', 'CEPS_CEP']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_CEPORIGEM}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    width: 140,
                                    fieldLabel: 'CEP Descarregamento',
                                    reference: 'cepdescarga',
                                    naoFocarAposPesquisar: true,
                                    proximoFoco: 'nota0',
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['MANIFESTOS_CEPDESTINO', 'CEPS_CEP']
                                    ],
                                    bind: {
                                        value: '{model.MANIFESTOS_CEPDESTINO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Protocolo',
                                    flex: 1,
                                    reference: 'protocolo',
                                    proximoFoco: 'email',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MANIFESTOS_PROTOCOLO}'
                                    }
                                }
                            ]
                        }
                    ]
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
                                    proximoFoco: 'nota0',
                                    bind: {
                                        value: '{model.MANIFESTOS_OBSERVACOES}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    layout: 'fit',
                    title: 'Notas Eletrônicas/Conhecimentos',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'notas',
                            qtdeLinhasMinima: 3,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'MANIFESTOS_ITENS',
                            idProperty: 'MANIFESTOSITENS_ID',
                            descartarSeVazio: 'MANIFESTOSITENS_NUMERO',
                            bind: {
                                store: '{notas}'
                            },
                            listeners: {
                                aposPublicarModel: 'fazerSomas',
                                onUpdate: 'onAposSelecionarNota'
                            },
                            fields: [
                                { hidden: true, name: 'MANIFESTOSITENS_ID' },
                                {
                                    title: 'Nota',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    documento: 'Nota Eletrônica',
                                    valueStatus: 2,
                                    tabela: 'movimentos',
                                    proximoFoco: 'nota[linhadebaixo]',
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'MANIFESTOSITENS_NUMERO',
                                    callbackFn: 'publicarModel',                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['MANIFESTOSITENS_NUMERO',        'MOVIMENTOS_NUMERO'],
                                        ['MANIFESTOSITENS_SERIE',         'MOVIMENTOS_SERIE'],
                                        ['MANIFESTOSITENS_NFE',           'MOVIMENTOS_NFE'],
                                        ['MANIFESTOSITENS_PROTOCOLO',     'MOVIMENTOS_PROTOCOLO'],
                                        ['MANIFESTOSITENS_PRODUTOS',      'MOVIMENTOS_PRODUTOS'],
                                        ['MANIFESTOSITENS_TOTAL',         'MOVIMENTOS_TOTAL'],
                                        ['MANIFESTOSITENS_EMISSAO',       'MOVIMENTOS_EMISSAO'],
                                        ['MANIFESTOSITENS_PESOLIQUIDO',   'MOVIMENTOSENVIO_PESOLIQUIDO'],
                                        ['MANIFESTOSITENS_ID_CIDADES',    'PESSOAS_ID_CIDADES'],
                                        ['CIDADES_NOMEITEM',              'CIDADES_NOME']
                                    ]
                                },
                                {
                                    title: 'Ser',
                                    width: 50,
                                    xtype: 'textfield',
                                    name: 'MANIFESTOSITENS_SERIE',//NE se nao tiver informado                                
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Código de Barras',
                                    flex: 1,
                                    xtype: 'textfield',
                                    proximoFoco: 'protocolo',
                                    name: 'MANIFESTOSITENS_NFE',                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }                       
                                },
                                {
                                    title: 'Protocolo',
                                    width: 150,
                                    xtype: 'textfield',
                                    name: 'MANIFESTOSITENS_PROTOCOLO',                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Produtos',
                                    name: 'MANIFESTOSITENS_PRODUTOS',
                                    empty: true,
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Total',
                                    name: 'MANIFESTOSITENS_TOTAL',
                                    empty: true,
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Descarregamento',
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'cidades',
                                    proximoFoco: 'nota[linhadebaixo]',
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'CIDADES_NOMEITEM',
                                    callbackFn: 'publicarModel',                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['CIDADES_NOMEITEM',           'CIDADES_NOME'],
                                        ['MANIFESTOSITENS_ID_CIDADES', 'CIDADES_ID']
                                    ]
                                },
                                { hidden: true, name: 'MANIFESTOSITENS_EMISSAO'     },
                                { hidden: true, name: 'MANIFESTOSITENS_PESOLIQUIDO' },
                                { hidden: true, name: 'MANIFESTOSITENS_ID_CIDADES'  }
                            ]
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
