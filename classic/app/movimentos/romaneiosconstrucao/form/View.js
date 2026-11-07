Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formromaneiosconstrucao',

    title: 'Romaneio',
 
    requires: [
        'SamosAdmin.movimentos.romaneiosconstrucao.form.ViewModel',
        'SamosAdmin.movimentos.romaneiosconstrucao.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Pedidos'
    ],

    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    constructor: function (config) {
        const tema = configs.getTema();

        if(!this.leftbuttons.filter(btn => btn.match && btn.match('Imprimir')).length) {
            const impressao = configs.getMovimentos().impressaoRomaneio || [];

            if(!impressao[0] || impressao[0] != 'Imprimir') {
                this.leftbuttons.splice(6, 0 , 'Imprimir: ' + impressao.join(','));
            } else {
                this.leftbuttons.splice(6, 0 , 'Imprimir');
            }
        }

       Ext.apply(this, {
            title: 'Romaneio',
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 145,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Transporte',
                                    tabela: 'transportes',
                                    reference: 'transporte',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    callbackFn: 'focarItens',                                    
                                    associations: [
                                        ['TRANSPORTES_NOME',         'TRANSPORTES_NOME'],
                                        ['ROMANEIOS_ID_TRANSPORTES', 'TRANSPORTES_ID']                                        
                                    ],
                                    bind: {
                                        value: '{model.TRANSPORTES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_ID_TRANSPORTES}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 78,
                                    reference: 'pedido',
                                    proximoFoco: 'serie',
                                    fieldLabel: 'Pedido',
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right;',                                    
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_NUMERO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 55,
                                    reference: 'serie',
                                    proximoFoco: 'pessoa',
                                    fieldLabel: 'Série',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_SERIE}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'Pessoa',
                                    proximoFoco: 'telefone',
                                    fieldLabel: 'Pessoa',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MOVIMENTOS_NOME}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    flex: false,
                                    width: 145,
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
                                    width: 145,
                                    flex: false,
                                    fieldLabel: 'Emissão',
                                    reference: 'emissao',
                                    proximoFoco: 'email',
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
                                    proximoFoco: 'email',
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
                                    proximoFoco: 'email',
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
                                    width: 55,
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
                                    proximoFoco: 'addpedidos',
                                    clicarNoProximoFoco: true,                                                                                                                       
                                    flex: false,
                                    width: 295,
                                    fieldLabel: 'Email',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PESSOAS_EMAIL}'
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
                                    width: 145,
                                    reference: 'celular',
                                    proximoFoco: 'frete',
                                    fieldLabel: 'Celular',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_CELULAR}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 145,
                                    flex: false,
                                    fieldLabel: 'Saída',
                                    reference: 'saida',
                                    proximoFoco: 'frete',
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
                                    proximoFoco: 'frete',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['N', 'Entregar'],
                                        ['I', 'Imediata'],
                                        ['E', 'Entregue'],
                                        ['J', 'Imediata Entregue']
                                    ],
                                    bind: {
                                        fieldStyle: '{isEntregue ? "color:blue" : "color:green"}',
                                        value: '{model.ROMANEIOS_STATUS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 288,  // 299
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Usuário',
                                    tabela: 'usuarios',
                                    reference: 'usuario',
                                    proximoFoco: 'frete',
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
                                    width: 295,
                                    reference: 'log',
                                    proximoFoco: 'frete',
                                    fieldLabel: 'Log',
                                    ui: 'field-readonly',
                                    fieldStyle:'color:green',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ROMANEIOS_LOG}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 295,
                                    reference: 'impressao',
                                    proximoFoco: 'frete',
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
                                    proximoFoco: 'frete',
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
                                    proximoFoco: 'frete',
                                    bind: {
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
                            width: 400,
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            items: [
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 182,
                                            fieldLabel: 'Frete',
                                            reference: 'frete',
                                            proximoFoco: 'seguro',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.ROMANEIOS_FRETE}',
                                                readOnly: '{readOnly}'
                                            },
                                            listeners: {
                                                keydown: 'calcularRomaneio'
                                            }                                            
                                        },
                                        {
                                            flex: false,
                                            width: 182,
                                            fieldLabel: 'Seguro',
                                            reference: 'seguro',
                                            proximoFoco: 'despesas',
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.ROMANEIOS_SEGURO}',
                                                readOnly: '{readOnly}'
                                            },
                                            listeners: {
                                                keydown: 'calcularRomaneio'
                                            }                                            
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: false,
                                            width: 182,
                                            fieldLabel: 'Despesas',
                                            reference: 'despesas',
                                            proximoFoco: 'produto0',
                                            clicarNoProximoFoco: true,                                                                                                                       
                                            xtype: 'samoswidgets-textmoney',
                                            bind: {
                                                value: '{model.ROMANEIOS_DESPESAS}',
                                                readOnly: '{readOnly}'
                                            },
                                            listeners: {
                                                keydown: 'calcularRomaneio'
                                            }
                                        },
                                        {
                                            flex: false,
                                            width: 182,
                                            fieldLabel: 'Total',
                                            reference: 'total_romaneio',
                                            xtype: 'samoswidgets-textmoney',
                                            clicarNoProximoFoco: true,                                                                               
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
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            descartarSeVazio: 'MOVIMENTOSITENS_ID_PRODUTOS',
                            name: 'ROMANEIOS_ITENS',
                            idProperty: 'ROMANEIOSITENS_ID',
                            bind: {
                                store: '{pedidos}'
                            },
                            listeners: {
                                antesDePublicarModel: 'verificarQuantidade',
                            },        
                            fields: [
                                {
                                    title: 'Numero',
                                    width : 100,                                        
                                    xtype: 'samoswidgets-textsearch',
                                    valueStatus: 5,
                                    tabela: 'movimentos',
                                    proximoFoco: 'itens',
                                    naoSairSeVazio: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'validarPedidoEAbrirItens',
                                    name: 'MOVIMENTOS_NUMERO',
                                    hidden: true,
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['MOVIMENTOS_NUMERO',            'MOVIMENTOS_NUMERO'],
                                        ['ROMANEIOSITENS_ID_MOVIMENTOS', 'MOVIMENTOS_ID'],
                                        ['MOVIMENTOS_SERIE',             'MOVIMENTOS_SERIE'],
                                        ['MOVIMENTOS_NOME',              'MOVIMENTOS_NOME'],
                                        ['MOVIMENTOS_ROMANEIOS',         'MOVIMENTOS_ROMANEIOS']
                                    ]
                                },
                                {
                                    title: 'Série',
                                    hidden: true,
                                    name: 'MOVIMENTOS_SERIE', 
                                    flex: false,                                        
                                    width: 60,
                                    readOnly: true
                                },
                                {
                                    title: 'Nome Pessoa',
                                    name: 'MOVIMENTOS_NOME',
                                    flex : 0.7,
                                    readOnly: true,
                                    hidden: true
                                },                                
                                {
                                    title: 'Itens',
                                    width : 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'movimentositens',
                                    proximoFoco: 'qtde',
                                    naoSairSeVazio: true,  
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                    callbackFn: 'verificarQuantidade',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    memoryStore: {
                                        from: 'Pedido',
                                        field: 'MOVIMENTOS_ROMANEIOS'
                                    },
                                    associations:[
                                        ['MOVIMENTOSITENS_ID_PRODUTOS',         'MOVIMENTOSITENS_ID_PRODUTOS'],
                                        ['ROMANEIOSITENS_ID_ITEM',              'MOVIMENTOSITENS_ID'],
                                        ['PRODUTOS_NOME',                       'PRODUTOS_NOME'],
                                        ['ROMANEIOSITENS_QUANTIDADE',           'ITENS_ENTREGAR'],
                                        ['MOVIMENTOSITENS_ENTREGUE',            'MOVIMENTOSITENS_ENTREGUE'],
                                        ['MOVIMENTOSITENS_DEPOSITO',            'MOVIMENTOSITENS_DEPOSITO'],
                                        ['MOVIMENTOSITENS_IMEDIATA',            'MOVIMENTOSITENS_IMEDIATA'],
                                        ['MOVIMENTOSITENS_EMROMANEIOORIGINAL',  'MOVIMENTOSITENS_EMROMANEIO'],
                                        ['MOVIMENTOSITENS_EMROMANEIO',          'MOVIMENTOSITENS_EMROMANEIO'],
                                        ['ITENS_ENTREGAR',                      'ITENS_ENTREGAR']
                                    ]                                      
                                }, 
                                {
                                    title: 'Nome Produto',
                                    name: 'PRODUTOS_NOME',
                                    xtype: 'textfield',                                    
                                    flex : 1,
                                    readOnly: true
                                },
                                {   title: 'Comprado',
                                    name: 'MOVIMENTOSITENS_QUANTIDADE',
                                    width: 110,                                    
                                    xtype: 'numberfield',   
                                    decimalSeparator: ',',
                                    minValue: 0.001,
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    }
                                },
                                {   title: 'Entregue',
                                    name: 'MOVIMENTOSITENS_EMROMANEIO',
                                    width: 110,                                    
                                    xtype: 'numberfield',   
                                    decimalSeparator: ',',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    }
                                },
                                {
                                    title: 'Qtde Entregar',
                                    name: 'ROMANEIOSITENS_QUANTIDADE',
                                    width: 110,
                                    xtype: 'numberfield',
                                    proximoFoco: 'numero[linhadebaixo]',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: 0.001,
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Entregar',
                                    name: 'ITENS_SELECAO',
                                    xtype: 'checkbox',
                                    width: 80,                                    
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },

                                { hidden: true, name: 'MOVIMENTOS_ROMANEIOS' },
                                { hidden: true, name: 'ROMANEIOSITENS_ID' },
                                { hidden: true, name: 'ROMANEIOSITENS_ID_ITEM' },
                                { hidden: true, name: 'ROMANEIOSITENS_ID_MOVIMENTOS' },
                                { hidden: true, name: 'MOVIMENTOSITENS_IMEDIATA'   },
                                { hidden: true, name: 'MOVIMENTOSITENS_ENTREGUE'   },
                                { hidden: true, name: 'MOVIMENTOSITENS_DEPOSITO'   },
                                { hidden: true, name: 'ITENS_ENTREGAR' },
                                { hidden: true, name: 'MOVIMENTOSITENS_EMROMANEIOORIGINAL'}
                            ]
                        }                        
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
