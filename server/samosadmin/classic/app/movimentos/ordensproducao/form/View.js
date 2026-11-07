Ext.define('SamosAdmin.movimentos.ordensproducao.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formordensproducao',

    requires: [
        'SamosAdmin.movimentos.ordensproducao.form.ViewModel',
        'SamosAdmin.movimentos.ordensproducao.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir',
        'Opções: Finalizar, Reabrir, Cancelamento'
    ],
    
    rightbuttons: [
        'Fechar',
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    
    title: 'Ordem Produção',

    defaultFocus: 'textfield[reference="produtoprincipal"]',

    constructor: function () {
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
                                    //naoFocarAposPesquisar: true,
                                    proximoFoco: 'produtoprincipal',
                                    buscarPor: 'Genérica',
                                    tabela: 'pessoas',
                                    fieldLabel: 'Pessoa',
                                    associations: [
                                        ['PESSOAS_NOME',         'PESSOAS_NOME'],
                                        ['PRODUCOES_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['PESSOAS_ENDERECO',     'PESSOAS_ENDERECO'],
                                        ['CIDADES_NOME',         'CIDADES_NOME'] ,
                                        ['CIDADES_ESTADO',       'CIDADES_ESTADO']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Inclusão',
                                    width: 125,
                                    reference: 'inclusao',
                                    ui: 'field-readonly',                                    
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUCOES_INCLUSAO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    width: 70,
                                    reference: 'hora',
                                    maxLength: 8,
                                    readOnly: true,
                                    ui: 'field-readonly',                                    
                                    bind: {
                                        value: '{model.PRODUCOES_HORAINCLUSAO}'
                                    }
                                },
                                {
                                    width: 110,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    fieldStyle:'text-align:right;color:red;',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{modelNumero}'
                                    }
                                },
                                {
                                    width: 45,
                                    fieldLabel: 'Série',
                                    reference: 'serie',
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
                                    fieldLabel: 'Endereço',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_ENDERECO}'
                                    }
                                },
                                {
                                    width: 200,
                                    reference: 'cidade',
                                    fieldLabel: 'Cidade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
                                    }
                                },
                                {
                                    width: 70,
                                    reference: 'estado',
                                    fieldLabel: 'UF',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Início',
                                    width: 125,
                                    proximoFoco: 'horainicio',
                                    reference: 'inicio',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PRODUCOES_INICIO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    width: 70,
                                    reference: 'horainicio',
                                    proximoFoco: 'produtoprincipal',
                                    maxLength: 8,
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PRODUCOES_HORAINICIO}'
                                    }
                                },
                                {
                                    width: 160,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    displayField: 'field2',
                                    fieldStyle: 'color:green',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['A', 'Aberta' ],
                                        ['F', 'Finalizada'],
                                        ['C', 'Cancelada']
                                    ],
                                    bind: {
                                        value: '{model.PRODUCOES_STATUS}'
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
                                    buscarPor: 'Genérica',
                                    callbackFn: 'updateLog',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    associations: [
                                        ['USUARIOS_LOGIN',        'USUARIOS_LOGIN']
                                        ['PRODUCOES_ID_USUARIOS', 'USUARIOS_ID'],
                                    ],
                                    bind: {
                                        value: '{model.USUARIOS_LOGIN}'
                                    }
                                },
                                {
                                    width: 275, 
                                    reference: 'log',
                                    fieldLabel: 'Log',
                                    fieldStyle:'color:green',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUCOES_LOG}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Finalizada',
                                    width: 125,
                                    reference: 'finalizada',
                                    proximoFoco: 'horafinalizada',                                    
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.PRODUCOES_FINALIZADA}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora',
                                    width: 70,
                                    reference: 'horafinalizada',
                                    maxLength: 8,
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.PRODUCOES_HORAFINALIZADA}'
                                    }
                                },
                                {
                                    width: 50,
                                    fieldLabel: 'Origem',
                                    reference: 'empresaorigem',
                                    ui: 'field-readonly',
                                    fieldStyle:'text-align:right',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUCOES_ID_EMPRESAORIGEM}'
                                    }
                                },
                                {
                                    width: 60,
                                    fieldLabel: 'Número',
                                    reference: 'numeroorigem',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {
                                        value: '{model.PRODUCOES_NUMEROORIGEM}'
                                    }
                                },
                                {
                                    width: 40,
                                    reference: 'serieorigem',
                                    fieldLabel: 'Série',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUCOES_SERIEORIGEM}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Produto a Produzir',
                    items: [
                        {
                            items: [
                                {
                                    width: 90,
                                    xtype: 'samoswidgets-textcustomsearch',
                                    fieldLabel: 'Produto',
                                    permitirApenasNumeros: true,
                                    reference: 'produtoprincipal',
                                    bind: {
                                        value: '{model.PRODUCOES_ID_PRODUTOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    search: {
                                        url: '/produtos',
                                        query: {
                                            ordem: 1,
                                            status: configs.getClientName() == 'malacrida' ? 'T' : 'P',
                                            empresa: configs.getEmpresa().id,
                                            tipopreco: configs.getMovimentos().tipoPreco
                                        },
                                        listeners: {
                                            afterSelection: 'aposSelecionarProdutoPrincipal',
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
                                                    [2, 'Código'],
                                                    [3, 'Genérica']
                                                ]
                                            },
                                            {
                                                xtype: 'combobox',
                                                fieldLabel: 'Status',
                                                reference: 'status',
                                                value: 'P',
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
                                            }
                                        ]
                                    }
                                },
                                {
                                    fieldLabel: 'Nome Produto',
                                    reference: 'nomeproduto',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    flex: 1,
                                    bind: {
                                        value: '{model.PRODUTOS_NOME}'
                                    }
                                },
                                {
                                    fieldLabel: 'Un',
                                    reference: 'unidade',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    width: 40,
                                    bind: {
                                        value: '{model.PRODUTOS_UNIDADE}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',                                    
                                    width: 85,
                                    fieldLabel: 'Embalagem',
                                    reference: 'embalagem',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUTOS_EMBALAGEM}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',                                    
                                    width: 85,
                                    fieldLabel: 'Múltiplos',
                                    reference: 'multiplos',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.MULTIPLOS_PRODUTOS}'
                                    }
                                },
                                {
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Código Lote',
                                    tabela: 'lotes',
                                    reference: 'lote',
                                    proximoFoco: 'quantidade',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['LOTES_ID',           'LOTES_ID'],
                                        ['LOTES_REFERENCIA',   'LOTES_REFERENCIA'],
                                        ['PRODUCOES_ID_LOTES', 'LOTES_ID'],
                                    ],
                                    bind: {
                                        value: '{model.LOTES_ID}',
                                        hidden: '{hideLoteProducao}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Lote',
                                    reference: 'referencialote',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    width: 120,
                                    bind: {
                                        value: '{model.LOTES_REFERENCIA}'
                                    }
                                },
                                {
                                    width: 90,
                                    fieldLabel: (configs.getClientName() == 'biomart' || configs.getClientName() == 'malacrida') ? 'Qtde (Kg)' : 'Qtde',
                                    reference: 'quantidade',
                                    xtype: 'samoswidgets-textmoney',
                                    proximoFoco: 'produto0',
                                    listeners: {
                                        change: 'aposAlterarQtdeCabecalho'
                                    },
                                    bind: {
                                        value: '{model.PRODUCOES_QUANTIDADE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Total',
                                    reference: 'total',
                                    xtype: 'samoswidgets-textmoney',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.VALOR_TOTAL}'
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
                    title: 'Composição',
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 0,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: true,
                            name: 'PRODUCOES_ITENS',
                            idProperty: 'PRODUCOESITENS_ID',
                            descartarSeVazio: 'PRODUCOESITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            listeners: {
                                //antesDePublicarModel: 'recalcularProduto'
                            },
                            fields: [
                                { hidden: true, name: 'PRODUCOESITENS_ID' },
                                { hidden: true, name: 'PRODUCOESITENS_ID_PRODUCOES' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'textfield',
                                    fieldStyle: 'text-align:right;',
                                    name: 'PRODUCOESITENS_ID_PRODUTOS',
                                    readOnly: true
                                },
                                {
                                    title: 'Descrição da Matéria Prima',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    readOnly: true
                                },
                                {
                                    title: 'Uni',
                                    width: 40,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_UNIDADE',
                                    hidden: configs.getClientName() != 'lislais',
                                    readOnly: true
                                },
                                {
                                    empty: true,
                                    name: 'PRODUCOESITENS_QUANTIDADE',
                                    width: 130,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: (configs.getClientName() == 'malacrida') ? '#9.999.990,000000' : '#9.999.990,0000',
                                    reference: 'qtdeproduto',
                                    title: 'Qtde',
                                    readOnly: true
                                },
                                {
                                    title: 'Total',
                                    reference: 'totalproduto',
                                    name: 'VALOR_TOTAL',
                                    width: 130,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    readOnly: true
                                },
                                { hidden: true, name: 'PRODUCOESITENS_CUSTO'     },
                                { hidden: true, name: 'FORMULASITENS_CUSTO'      },
                                { hidden: true, name: 'FORMULASITENS_QUANTIDADE' },
                                { hidden: true, name: 'FORMULASITENS_PERCENTUAL' }
                            ]
                        }
                    ]
                }
            ]
        });
        
        this.callParent(arguments);
    }
});
