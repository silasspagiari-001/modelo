Ext.define('SamosAdmin.atualizacao.produtos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formprodutos',

    title: 'Produto',

    requires: [
        'SamosAdmin.atualizacao.produtos.form.ViewModel',
        'SamosAdmin.atualizacao.produtos.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Fotos'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        const tema = configs.getTema();  
        const usaConvenios = (configs.getProdutos().conveniooutros || []).length > 0
        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Dados Básicos',
                    items:[
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'Código',
                                    reference: 'codigo',
                                    bind: {
                                        value: '{modelId}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'codigobarras',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.PRODUTOS_STATUS}',
                                        readOnly: '{readOnly}',
                                        store: configs.getProdutos().status.filter(status => status[0] != '')
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Classificação',
                                    reference: 'classificacao',
                                    proximoFoco: 'codigobarras',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.SALDOS_CSTSUBST}',
                                        readOnly: '{readOnly}',
                                        hidden: '{hideCstsubst}',
                                        store: (configs.getProdutos().cstsubst || [])
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    flex: false,
                                    width: 200,
                                    fieldLabel: 'Código de Barras',
                                    reference: 'codigobarras',
                                    proximoFoco: 'fabrica',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PRODUTOS_BARRA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'button',
                                    margin: '15 15 7 1',
                                    ui: 'primary-' + tema,
                                    reference: 'gerarcdb',
                                    text: 'Gerar',
                                    bind: {
                                        hidden: '{hideBtnBarras}',
                                    },
                                    listeners: {
                                        click: 'onGerarCdbClick'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 200,
                                    fieldLabel: configs.getProdutos().labelFabrica,
                                    reference: 'fabrica',
                                    proximoFoco: 'marca',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PRODUTOS_FABRICA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelMarca,
                                    reference: 'marca',
                                    proximoFoco: configs.getClientName() == 'racaforte' ? 'saldosite' : 'unidades',
                                    maxLength: 15,
                                    hidden: !configs.getProdutos().marcaproduto,
                                    bind: {
                                        value: '{model.PRODUTOS_MARCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 7
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Saldo Site',
                                    reference: 'saldosite',
                                    proximoFoco: 'unidades',
                                    fieldStyle:'font-weight: bold;color:purple;',
                                    hidden: configs.getClientName() != 'racaforte',
                                    bind: {
                                        value: '{model.SALDOS_TRANSFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: configs.getProdutos().labelMarca,
                                    reference: 'marcacombo',
                                    proximoFoco: 'unidades',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: configs.getProdutos().marcas,
                                    hidden: !configs.getProdutos().marcacombo,                                    
                                    bind: {
                                        value: '{model.PRODUTOS_MARCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 100,
                                    xtype: 'combobox',
                                    fieldLabel: 'Unidade',
                                    reference: 'unidades',
                                    proximoFoco: configs.getProdutos().hideEmbalagem ? 'nome ': 'embalagem',
                                    forceSelection: true,
                                    editable: false,
                                    bind: {
                                        value: '{model.PRODUTOS_UNIDADE}',
                                        readOnly: '{readOnly}',
                                        store: configs.getProdutos().unidades
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',                                    
                                    width: 140,
                                    flex: false,
                                    fieldLabel: configs.getProdutos().labelEmbalagem,
                                    reference: 'embalagem',
                                    proximoFoco: 'nome',
                                    hidden: configs.getProdutos().hideEmbalagem ? true : false,
                                    bind: {
                                        value: '{model.PRODUTOS_EMBALAGEM}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'copiarParaMultiplos'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: configs.getProdutos().descricao.readOnly ? 'convenio' : 'descricao',
                                    maxLength: 100,
                                    bind: {
                                        value: '{model.PRODUTOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: (configs.getProdutos().hideConvenio ? 500 : 367),
                                    fieldLabel: configs.getProdutos().descricao.label,
                                    reference: 'descricao',
                                    proximoFoco: 'aplicacao',
                                    maxLength: 30,
                                    hidden: configs.getProdutos().descricao.hidden ? true : false,                                    
                                    ui: configs.getProdutos().descricao.readOnly ? 'field-readonly' : 'textbold-' + configs.getTema(),
                                    bind: {
                                        value: '{model.PRODUTOS_DESCRICAO}',
                                        readOnly: configs.getProdutos().descricao.readOnly ? true : '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 140,
                                    fieldLabel: configs.getProdutos().conveniooutros.length == 0 ? 'Localização' : 'Convênio',
                                    reference: 'convenio',
                                    proximoFoco: 'aplicacao',
                                    maxLength: 15,
                                    fieldStyle:'color:purple;',                                    
                                    hidden: (configs.getProdutos().conveniooutros.length > 0),
                                    bind: {
                                        value: '{model.SALDOS_LOCAL}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',                                    
                                    width: 140,
                                    fieldLabel: 'Multiplos',
                                    reference: 'multiplos',
                                    proximoFoco: 'nome',
                                    hidden: (configs.getClientName() != 'biomart' && configs.getClientName() != 'organoplant'),
                                    bind: {
                                        value: '{model.MULTIPLOS_PRODUTOS}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelAplicacao,
                                    reference: 'aplicacao',
                                    proximoFoco: 'referencia',
                                    maxLength: 512,
                                    bind: {
                                        value: '{model.PRODUTOS_APLICACAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 140,
                                    fieldLabel: (configs.getProdutos().labelReferencia || 'Referência'),
                                    reference: 'referencia',
                                    proximoFoco: configs.getProdutos().montagemProdutos ? 'montagem' : 'pessoa',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PRODUTOS_REFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }                                    
                                },
                                {
                                    flex: false,
                                    width: 367,
                                    xtype: 'samoswidgets-textsearch',
                                    hidden: !configs.getProdutos().montagemProdutos,                                    
                                    fieldLabel: configs.getProdutos().labelMontagem ? configs.getProdutos().labelMontagem : 'Montagem',
                                    tabela: 'montagens',
                                    reference: 'montagem',
                                    proximoFoco: 'pessoa',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['MONTAGENS_NOME',        'MONTAGENS_NOME'],
                                        ['PRODUTOS_ID_MONTAGENS', 'MONTAGENS_ID']
                                    ],
                                    bind: {
                                        value: '{model.MONTAGENS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PRODUTOS_ID_MONTAGENS}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Informações Adicionais',
                    items: [
                        {
                            items: [
                                {
                                    width: 80,
                                    fieldLabel: 'Cód Pessoa',
                                    bind: {
                                        value: '{model.PRODUTOS_ID_PESSOAS}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch', 
                                    fieldLabel: 'Pessoa',
                                    tabela: 'pessoas',
                                    reference: 'pessoa',
                                    proximoFoco: 'grupo',
                                    buscarPor: 'Genérica',
                                    naoFocarAposPesquisar: true,                            
                                    associations: [
                                        ['PESSOAS_NOME',        'PESSOAS_NOME'],
                                        ['PESSOAS_FORMULA',     'PESSOAS_FORMULA'],
                                        ['PRODUTOS_ID_PESSOAS', 'PESSOAS_ID']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: configs.getClientName() == 'prudenmoveis' ? 'carregaParametros' : Ext.emptyFn
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Grupo',
                                    tabela: 'grupos',
                                    reference: 'grupo',
                                    proximoFoco: 'ncm',
                                    buscarPor: 'Genérica',
                                    bind: {
                                        associations: '{grupoAssociations}',
                                        value: '{model.GRUPOS_NOME}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() == 'prudenmoveis' ? 'setarMargemGrupo' : Ext.emptyFn
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PRODUTOS_ID_GRUPOS}'
                                    }
                                }
                            ]
                        },
                        {
                            hidden: !usaConvenios,
                            items: [
                                {
                                            
                                    xtype: 'combobox',
                                    fieldLabel: 'Convênio ICMS Local',
                                    flex: 1,
                                    reference: 'conveniolocal',
                                    proximoFoco: 'conveniorg1',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    matchFieldWidth: false,                                    
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.CONVENIO_LOCAL}',
                                        store: configs.getProdutos().conveniolocal,
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        afterrender: function(combo) {
                                            combo.getPicker().setWidth(700);
                                        }
                                    }
                                },
                                {
                                            
                                    xtype: 'combobox',
                                    fieldLabel: 'Convênio ICMS Região 1',
                                    flex: 1,
                                    reference: 'conveniorg1',
                                    proximoFoco: 'conveniorg2',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    matchFieldWidth: false,
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.CONVENIO_OUTROS}',
                                        store: configs.getProdutos().conveniooutros,
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        afterrender: function(combo) {
                                            combo.getPicker().setWidth(700);
                                        }
                                    }
                                },
                                {
                                            
                                    xtype: 'combobox',
                                    fieldLabel: 'Convênio ICMS Região 2',
                                    flex: 1,
                                    reference: 'conveniooutros',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    matchFieldWidth: false,                                    
                                    editable: false,                                    
                                    bind: {
                                        value: '{model.CONVENIO_REGIAO12}',
                                        store: configs.getProdutos().convenio12,
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        afterrender: function(combo) {
                                            combo.getPicker().setWidth(700);
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Descrição Ncm',
                                    tabela: 'ncms',
                                    reference: 'ncm',
                                    proximoFoco: 'pesoliquido',
                                    buscarPor: 'Genérica',
                                    associations: configs.getClientName() == 'racaforte' ?
                                        [
                                            ['NCMS_NOME',             'NCMS_NOME'],
                                            ['PRODUTOS_ID_NCMS',      'NCMS_ID'],
                                            ['NCMS_NCM',              'NCMS_NCM'],
                                            ['PRODUTOS_DESCRICAO',    'CSTS_ALIQUOTAS'],   
                                            ['SALDOS_ALIQUOTAPIS',    'NCMS_ALIQUOTAPIS'],
                                            ['SALDOS_ALIQUOTACOFINS', 'NCMS_ALIQUOTACOFINS']
                                        ] :
                                        [
                                            ['NCMS_NOME',             'NCMS_NOME'],
                                            ['PRODUTOS_ID_NCMS',      'NCMS_ID'],
                                            ['NCMS_NCM',              'NCMS_NCM'],
                                            ['SALDOS_ALIQUOTAPIS',    'NCMS_ALIQUOTAPIS'],
                                            ['SALDOS_ALIQUOTACOFINS', 'NCMS_ALIQUOTACOFINS']
                                        ],
                                    bind: {
                                        value: '{model.NCMS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PRODUTOS_ID_NCMS}'
                                    }
                                },
                                {
                                    width: 90,
                                    fieldLabel: 'NCM',
                                    reference: 'codncm',
                                    bind: {
                                        value: '{model.NCMS_NCM}'
                                    },
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },    
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'CST IBS/CBS',
                                    flex: 1,
                                    reference: 'cstibscbs',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    matchFieldWidth: false,
                                    editable: false,
                                    bind: {
                                        value: '{model.PRODUTOS_CSTIBSCBS}',
                                        store: configs.getProdutos().cstibscbs,
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'onCstIbsCbsChange',
                                        afterrender: function(combo) {
                                            combo.getPicker().setWidth(450);
                                        }
                                    }                                    
                                },   
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'ClassTrib',
                                    width: 95,
                                    reference: 'cclasstrib',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    matchFieldWidth: false,
                                    editable: false,
                                    bind: {
                                        value: '{model.PRODUTOS_CLASSTRIB}',
                                        store: configs.getProdutos().cclasstrib,
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        afterrender: function(combo) {
                                            combo.getPicker().setWidth(600);
                                        }
                                    }
                                },                                                             
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',                                    
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Peso Líquido',
                                    reference: 'pesoliquido',
                                    proximoFoco: 'pesobruto',
                                    bind: {
                                        value: '{model.PRODUTOS_PESOLIQUIDO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    flex: false,
                                    width: 90,
                                    fieldLabel: 'Peso Bruto',
                                    reference: 'pesobruto',
                                    proximoFoco: 'maximo',
                                    bind: {
                                        value: '{model.PRODUTOS_PESOBRUTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 110, // 140
                                    xtype: 'combobox',                                    
                                    reference: 'tipo',
                                    proximoFoco: 'inventario',
                                    forceSelection: true,
                                    editable: false,
                                    fieldStyle:'color:blue;',                                                                        
                                    bind: {
                                        fieldLabel: configs.getProdutos().labelDerivado,
                                        value: '{model.PRODUTOS_DERIVADO}',
                                        readOnly: '{readOnly}',
                                        store: configs.getProdutos().derivado.filter(derivado => derivado[0] != '')
                                    }
                                },
                                {
                                    width: 85, // all combos 106
                                    flex: false,
                                    fieldLabel: 'Editável',
                                    reference: 'editavel',
                                    proximoFoco: 'inventario',
                                    bind: {
                                        value: '{model.PRODUTOS_EDITAVEL}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: false
                                },
                                {
                                    width: 85,
                                    flex: false,
                                    fieldLabel: 'Inventário',
                                    reference: 'inventario',
                                    proximoFoco: 'listapreco',
                                    bind: {
                                        value: '{model.PRODUTOS_INVENTARIO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    width: 85,
                                    flex: false,
                                    fieldLabel: configs.getProdutos().labelListaPreco || 'Lista Preço',
                                    reference: 'listapreco',
                                    proximoFoco: 'maximo',
                                    bind: {
                                        value: '{model.PRODUTOS_LISTAPRECO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Saldos',
                    items: [
                        {
                            items: 
                            configs.getClientName() == 'stilomoveis' ? 
                            [ // Linha 1 saldos da Stilo
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: 'Máximo',
                                    reference: 'maximo',
                                    proximoFoco: 'saldocomprado',
                                    bind: {
                                        value: '{model.SALDOS_MAXIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'Comprado',
                                    reference: 'saldocomprado',
                                    proximoFoco: 'custo',
                                    bind: {
                                        value: '{model.SALDOS_COMPRADO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'R$ Custo',
                                    reference: 'custo',
                                    proximoFoco: 'margem',
                                    bind: {
                                        value: '{model.SALDOS_CUSTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: configs.getProdutos(). labelMargem || '% Margem',
                                    reference: 'margem',
                                    proximoFoco: 'margemmin',
                                    bind: {
                                        value: '{model.SALDOS_MARGEM}',  // Margem Parcelado
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  
                                    flex: 1,
                                    hidden: !configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: configs.getProdutos().labelMinima || '% Margem Mín',
                                    reference: 'margemmin',
                                    proximoFoco: 'margempro',
                                    bind: {
                                        value: '{model.SALDOS_MARGEMMINIMA}', // Margem Vista
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPrecoMinimo'
                                    }
                                },
                                {                                    
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPromo || '% Margem Promoção',
                                    reference: 'margempro',
                                    proximoFoco: 'preco',
                                    bind: {
                                        value: '{model.SALDOS_TRANSFERENCIA}', // Margem Promoção
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPrecoPromocional'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    hidden: configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: '% MarkUp',
                                    reference: 'markup',
                                    proximoFoco: configs.getProdutos().precoMargemMinimo ? 'precomin' : configs.getClientName() == 'prudenaco' ? 'precobarra' : 'prazo',
                                    bind: {
                                        value: '{model.SALDOS_MARKUP}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // Preço parcelado Stilo
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPreco,
                                    reference: 'preco',
                                    proximoFoco: 'precomin',
                                    fieldStyle:'color:green;',                                    
                                    bind: {
                                        value: '{model.SALDOS_PRECO}',
                                        readOnly: '{readOnly}',
                                    },
                                    listeners: {
                                        change: 'calcularMargem'
                                    }                                    
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', // Preço à vista Stilo
                                    flex: 1,
                                    hidden: !configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: (configs.getProdutos().labelMinimo || ' Preço Mínimo'),
                                    reference: 'precomin',
                                    proximoFoco: 'prazo',
                                    bind: {
                                        value: '{model.SALDOS_PRECOMINIMO}',
                                        readOnly: '{readOnly}',
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', // Preço promoção Stilo
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPrazo,
                                    reference: 'prazo',
                                    proximoFoco: 'saldominimo',
                                    bind: {
                                        value: '{model.SALDOS_PRAZO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ] : 
                            configs.getClientName() == 'racaforte' ? 
                            [ // Linha 1 saldos da Raçaforte
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: 'Máximo',
                                    reference: 'maximo',
                                    proximoFoco: 'custo',
                                    bind: {
                                        value: '{model.SALDOS_MAXIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {                                    
                                    flex: 1,  // (para alinhamento)
                                    fieldLabel: 'Ø',
                                    readOnly: true,
                                    ui: 'field-readonly',                                    
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'R$ Custo',
                                    reference: 'custo',
                                    proximoFoco: 'margem',
                                    bind: {
                                        value: '{model.SALDOS_CUSTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelMargem || '% Margem',
                                    reference: 'margem',
                                    proximoFoco: 'preco',
                                    bind: {
                                        value: '{model.SALDOS_MARGEM}', 
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPreco,
                                    reference: 'preco',
                                    proximoFoco: 'custoa',
                                    fieldStyle:'color:green;',                                    
                                    bind: {
                                        value: '{model.SALDOS_PRECO}',
                                        readOnly: '{readOnly}',
                                    },
                                    listeners: {
                                        change: 'calcularMargem'
                                    }                                    
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', // Custo 2
                                    flex: 1,
                                    fieldLabel: 'Custo 2',
                                    reference: 'custoa',
                                    proximoFoco: 'margema',
                                    bind: {
                                        value: '{model.SALDOS_COMPRADO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPrecosA'
                                    }

                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  
                                    flex: 1,
                                    fieldLabel: '% Margem 2',
                                    reference: 'margema',
                                    proximoFoco: 'precoa',
                                    bind: {
                                        value: '{model.SALDOS_MARGEMMINIMA}', // Margem Atacado
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPrecosA'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', // Preço atacado raçaforte
                                    flex: 1,
                                    fieldLabel: 'Preço 2',
                                    reference: 'precoa',
                                    fieldStyle:'color:blue;',
                                    proximoFoco: 'saldominimo',
                                    bind: {
                                        value: '{model.SALDOS_PRECOMINIMO}',
                                        readOnly: '{readOnly}',
                                    }
                                }
                            ] :
                            configs.getClientName() == 'prudenmoveis' ? 
                            [ // Linha 1 saldos da Prudenmoveis/Edular
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: 'Máximo',
                                    reference: 'maximo',
                                    proximoFoco: 'saldocomprado',
                                    bind: {
                                        value: '{model.SALDOS_MAXIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'Comprado',
                                    reference: 'saldocomprado',
                                    proximoFoco: 'saldodisponivel',
                                    bind: {
                                        value: '{model.SALDOS_COMPRADO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'Dísponivel',
                                    reference: 'saldodisponivel',
                                    proximoFoco: 'comissao',
                                    fieldStyle:'color:red;',
                                    bind: {
                                        value: '{model.SALDOS_DISPONIVEL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: '% Comissão',
                                    reference: 'comissao',
                                    proximoFoco: 'compras',
                                    fieldStyle: 'text-align:right;',
                                    bind: {
                                        value: '{model.SALDOS_COMISSAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 4
                                    flex: 1,
                                    fieldLabel: 'R$ Compra',
                                    reference: 'compras',
                                    proximoFoco: 'ipi',
                                    bind: {
                                        value: '{model.SALDOS_COMPRA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto' // Pruden/Edular
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 5
                                    flex: 1,
                                    fieldLabel: '% Ipi',
                                    reference: 'ipi',
                                    proximoFoco: 'frete',
                                    bind: {
                                        value: '{model.SALDOS_IPI}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto' // Pruden/Edular
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 5
                                    flex: 1,
                                    fieldLabel: '% Frete',
                                    reference: 'frete',
                                    proximoFoco: 'seguro',
                                    bind: {
                                        value: '{model.PERCENTUAL_FRETE}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto' // Pruden/Edular
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: '% Seguro',
                                    reference: 'seguro',
                                    proximoFoco: 'despesas',
                                    bind: {
                                        value: '{model.PERCENTUAL_SEGURO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto' // Pruden/Edular
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: '% Despesas',
                                    reference: 'despesas',
                                    proximoFoco: 'saldominimo',
                                    bind: {
                                        value: '{model.PERCENTUAL_DESPESAS}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto' // Pruden/Edular
                                    }
                                }
                            ] : // Fim da linha 1 Pruden/Edular                           
                            [ // Linha 1 Saldos Demais clientes
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: 'Máximo',
                                    reference: 'maximo',
                                    proximoFoco: 'saldocomprado',
                                    bind: {
                                        value: '{model.SALDOS_MAXIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'Comprado',
                                    reference: 'saldocomprado',
                                    proximoFoco: 'custo',
                                    bind: {
                                        value: '{model.SALDOS_COMPRADO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'R$ Custo',
                                    reference: 'custo',
                                    proximoFoco: 'margem',
                                    bind: {
                                        value: '{model.SALDOS_CUSTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() == 'hermes' ? Ext.emptyFn : 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: '% Margem',
                                    reference: 'margem',
                                    proximoFoco: configs.getProdutos().precoMargemMinimo ? 'margemmin' : 'markup',
                                    bind: {
                                        value: '{model.SALDOS_MARGEM}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    hidden: !configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: '% MargMín',
                                    reference: 'margemmin',
                                    proximoFoco: 'preco',
                                    bind: {
                                        value: '{model.SALDOS_MARGEMMINIMA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPrecoMinimo'
                                    }
                                },
                                {                                    
                                    flex: 1,  // 5B (Substitui o acima no alinhamento)
                                    hidden: configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: 'Ø',
                                    readOnly: true,
                                    ui: 'field-readonly',                                    
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    hidden: configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: '% MarkUp',
                                    reference: 'markup',
                                    proximoFoco: configs.getProdutos().precoMargemMinimo ? 'precomin' : configs.getClientName() == 'prudenaco' ? 'precobarra' : 'prazo',
                                    bind: {
                                        value: '{model.SALDOS_MARKUP}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {                                    
                                    flex: 1,  // (Substitui o acima no alinhamento)
                                    hidden: !configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: 'Ø',
                                    ui: 'field-readonly', 
                                    readOnly: true                                   
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    hidden: !configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: (configs.getProdutos().labelMinimo || ' Preço Mínimo'),
                                    reference: 'precomin',
                                    proximoFoco: configs.getClientName() != 'prudenaco' ? 'prazo' : 'precobarra',
                                    bind: {
                                        value: '{model.SALDOS_PRECOMINIMO}',
                                        readOnly: '{readOnly}',
                                    }
                                },
                                {                                    
                                    flex: 1,  // (Substitui o acima no alinhamento)
                                    hidden: configs.getProdutos().precoMargemMinimo,
                                    fieldLabel: 'Ø',
                                    readOnly: true,
                                    ui: 'field-readonly',                                    
                                },
                                {
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPrazo,  // 6
                                    reference: 'prazo',
                                    hidden: (configs.getClientName() == 'prudenaco' ||
                                             configs.getClientName() == 'casanova'),
                                    proximoFoco: 'preco',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.SALDOS_PRAZO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {                                    
                                    flex: 1,  // (Substitui o acima no alinhamento)
                                    hidden: configs.getClientName() != 'casanova',
                                    fieldLabel: 'Ø',
                                    ui: 'field-readonly', 
                                    readOnly: true                                   
                                },
                                {
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelTransferencia,  // 6
                                    reference: 'precobarra',
                                    hidden: configs.getClientName() != 'prudenaco',
                                    proximoFoco: 'preco',
                                    xtype: 'samoswidgets-textmoney',
                                    bind: {
                                        value: '{model.SALDOS_TRANSFERENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 6
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPreco,
                                    reference: 'preco',
                                    proximoFoco: 'saldominimo',
                                    fieldStyle:'color:green;',                                    
                                    bind: {
                                        value: '{model.SALDOS_PRECO}',
                                        readOnly: '{readOnly}',
                                    },
                                    listeners: {
                                        change: 'calcularMargem'
                                    }
                                }
                            ]
                        },
                        {
                            items: 
                            configs.getClientName() == 'prudenmoveis' ?  // (Linha 2 Saldos - Prudenmoveis)                          
                            [
                                {
                                    xtype: 'samoswidgets-textmoney',  // 1
                                    flex: 1,
                                    fieldLabel: 'Mínimo',
                                    reference: 'saldominimo',
                                    proximoFoco: 'saldoreservado',
                                    bind: {
                                        value: '{model.SALDOS_MINIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 2
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelReservado,
                                    reference: 'saldoreservado',
                                    proximoFoco: 'custo',
                                    bind: {
                                        value: '{model.SALDOS_RESERVADO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 9
                                    flex: 1,
                                    fieldLabel: 'R$ Custo',
                                    reference: 'custo',
                                    proximoFoco: 'margemmin',
                                    fieldStyle: 'text-align:right;',
                                    bind: {
                                        value: '{model.SALDOS_CUSTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto'
                                    }                                    
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  
                                    flex: 1,
                                    fieldLabel: '% Margem Mínima',
                                    reference: 'margemmin',
                                    proximoFoco: 'precomin',
                                    bind: {
                                        value: '{model.SALDOS_MARGEMMINIMA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularPrecoMinimo'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: 'Preço Mínimo',
                                    reference: 'precomin',
                                    proximoFoco: 'margem',
                                    bind: {
                                        value: '{model.SALDOS_PRECOMINIMO}',
                                        readOnly: '{readOnly}',
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  
                                    flex: 1,
                                    fieldLabel: '% Margem',
                                    reference: 'margem',
                                    proximoFoco: 'preco',
                                    bind: {
                                        value: '{model.SALDOS_MARGEM}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: 'Preço à Vista',
                                    reference: 'preco',
                                    proximoFoco: 'margemprazo',
                                    bind: {
                                        value: '{model.SALDOS_PRECO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    flex: 1,
                                    fieldLabel: '% à Prazo',
                                    reference: 'margemprazo',
                                    proximoFoco: 'prazo',
                                    bind: {
                                        value: '{model.SALDOS_ALIQUOTACFE}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'calcularCusto'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPrazo,
                                    reference: 'prazo',
                                    proximoFoco: 'redulocal',
                                    bind: {
                                        value: '{model.SALDOS_PRAZO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ] : [ // Linha 2 demais clientes
                                {
                                    xtype: 'samoswidgets-textmoney',  // 1
                                    flex: 1,
                                    fieldLabel: 'Mínimo',
                                    reference: 'saldominimo',
                                    proximoFoco: 'compras',
                                    bind: {
                                        value: '{model.SALDOS_MINIMO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 9
                                    flex: 1,
                                    fieldLabel: '% Com.Prazo',
                                    reference: 'comissaoprazo',
                                    proximoFoco: 'saldominimo',
                                    fieldStyle: 'text-align:right;',
                                    hidden:!configs.getProdutos().comissaoPrazo,
                                    bind: {
                                        value: '{model.SALDOS_COMISSAOPRAZO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {                                    
                                    flex: 1,  // 9B (Substitui o acima no alinhamento)
                                    hidden: configs.getProdutos().comissaoPrazo,
                                    fieldLabel: 'Ø',
                                    ui: 'field-readonly', 
                                    readOnly: true                                   
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 3
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelTransferencia,
                                    reference: 'transferencia',
                                    proximoFoco: 'compras',
                                    hidden: (configs.getClientName() == 'prudenaco' || 
                                             configs.getClientName() == 'stilomoveis' ||
                                             configs.getClientName() == 'racaforte'),
                                    bind: {
                                        value: '{model.SALDOS_TRANSFERENCIA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() == 'hermes' ? Ext.emptyFn : 'calcularValores'
                                    }
                                },
                                {                                    
                                    flex: 1,  // (Substitui o acima no alinhamento)
                                    hidden: configs.getClientName() != 'stilomoveis',
                                    fieldLabel: 'Ø',
                                    ui: 'field-readonly', 
                                    readOnly: true                                   
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 3
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelPrazo,
                                    reference: 'transferencia',
                                    proximoFoco: 'compras',
                                    hidden: configs.getClientName() != 'prudenaco',
                                    bind: {
                                        value: '{model.SALDOS_PRAZO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() == 'hermes' ? Ext.emptyFn : 'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 4
                                    flex: 1,
                                    fieldLabel: 'R$ Compra',
                                    reference: 'compras',
                                    proximoFoco: 'ipi',
                                    bind: {
                                        value: '{model.SALDOS_COMPRA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() == 'hermes' ? Ext.emptyFn : 
                                                configs.getClientName() == 'stilomoveis' ? 'calcularCusto' : 
                                                                                           'calcularValores'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 5
                                    flex: 1,
                                    fieldLabel: '% Ipi',
                                    reference: 'ipi',
                                    proximoFoco: configs.getClientName() == 'stilomoveis' ? 'saldofrete' : 'precoatacado',
                                    bind: {
                                        value: '{model.SALDOS_IPI}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() != 'stilomoveis' ? Ext.emptyFn : 'calcularCusto'
                                    }
                                },
                                {                                    
                                    flex: 1,  // Preço de Atacado
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'R$ Atacado',
                                    hidden: configs.getClientName() == 'stilomoveis',
                                    bind: {
                                        value: '{model.SALDOS_PRECOATACADO}',
                                        readOnly: '{readOnly}'
                                    }                                    
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 2
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelReservado,
                                    reference: 'saldofrete',
                                    proximoFoco: 'comissao',
                                    hidden: configs.getClientName() != 'stilomoveis',                                    
                                    bind: {
                                        value: '{model.SALDOS_RESERVADO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: configs.getClientName() != 'stilomoveis' ? Ext.emptyFn : 'calcularCusto'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 9
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().comissaoPrazo ? '% Com.Vista' : '% Comissão',
                                    reference: 'comissao',
                                    proximoFoco: 'comissaoprazo',
                                    fieldStyle: 'text-align:right;',
                                    hidden:!configs.getProdutos().comissaoVista,                                    
                                    bind: {
                                        value: '{model.SALDOS_COMISSAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {                                    
                                    flex: 1,  // (Substitui o acima no alinhamento)
                                    hidden: configs.getProdutos().comissaoVista,
                                    fieldLabel: 'Ø',
                                    ui: 'field-readonly', 
                                    readOnly: true                                   
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 2
                                    flex: 1,
                                    fieldLabel: configs.getProdutos().labelReservado,
                                    reference: 'saldoreservado',
                                    proximoFoco: 'transferencia',
                                    bind: {
                                        value: '{model.SALDOS_RESERVADO}',  
                                        hidden: '{hideReservado}' ,
                                        readOnly: '{readOnly || reservadoBiomart}'
                                    }
                                },
                                {                                    
                                    flex: 1,  // 9B (Substitui o acima no alinhamento)
                                    fieldLabel: 'Ø',
                                    ui: 'field-readonly', 
                                    readOnly: true,
                                    bind: {
                                        hidden: '{!hideReservado}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney', 
                                    flex: 1,
                                    fieldLabel: 'Dísponivel',
                                    reference: 'saldodisponivel',
                                    proximoFoco: 'escrituracao',
                                    fieldStyle:'color:red;',
                                    hidden: configs.getClientName() == 'racaforte',
                                    bind: {
                                        value: '{model.SALDOS_DISPONIVEL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',  // 7
                                    flex: 1,
                                    fieldLabel: 'Dísponivel',
                                    reference: 'saldoliquido',
                                    proximoFoco: 'escrituracao',
                                    fieldStyle:'color:red;',
                                    hidden: configs.getClientName() != 'racaforte',
                                    readOnly: true,                                    
                                    bind: {
                                        value: '{model.LIQUIDO_ESTOQUE}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Dados Fiscais',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '0 0 0 0',
                            padding: '10 10 10 10',
                            flex: 1,
                            defaultType: 'fieldcontainer',
                            layout: 'fit',
                            items: [
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            xtype: 'combobox',
                                            fieldLabel: 'Escrituração',
                                            reference: 'escrituracao',
                                            proximoFoco: 'excecao',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.SALDOS_ESCRITURACAO}',
                                                readOnly: '{readOnly}',
                                                store: [
                                                    ['0', '+ IPI/ICMS'],
                                                    ['1', '- IPI/ICMS Isento'],
                                                    ['2', '- IPI/ICMS Outros'],
                                                    ['3', '+ ICMS/IPI Isento'],
                                                    ['4', '+ ICMS/IPI Outros'],
                                                    ['5', '+ IPI/ICMS Isento'],
                                                    ['6', '+ IPI/ICMS Outros'],
                                                    ['9', 'Ø Nula/Saldo 0']
                                                ]
                                            }
                                        },
                                        {
                                            flex: 1,
                                            xtype: 'combobox',
                                            fieldLabel: 'Exceção',
                                            reference: 'excecao',
                                            proximoFoco: 'aliquotacfe',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            matchFieldWidth: false,
                                            editable: false,                               
                                            bind: {
                                                value: '{model.SALDOS_EXCECAO}',
                                                readOnly: '{readOnly}',
                                                store: [
                                                    ['0', 'Normal'],
                                                    ['1', 'Icms^Ipi'],
                                                    ['2', 'Isento Icms PRPJ SP'],
                                                    ['3', 'Diferido Icms PRPJ SP'],
                                                    ['4', 'Redução BC apenas PRPJ']
                                                ]
                                            },
                                            listeners: {
                                                afterrender: function(combo) {
                                                    combo.getPicker().setWidth(210);
                                                }
                                            }
                                        },
                                        {
                                            width: 70,
                                            xtype: 'samoswidgets-textmoney',
                                            fieldLabel: '% Subst',
                                            reference: 'percsubst',
                                            proximoFoco: 'cbenefloc',
                                            bind: {
                                                value: '{model.SALDOS_ALIQUOTASUBST}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            flex: 1,
                                            xtype: 'combobox',
                                            fieldLabel: 'Cód Benef Local',
                                            reference: 'cbenefloc',
                                            proximoFoco: 'cbenefrg1',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.SALDOS_BENEFICIOLC}',
                                                readOnly: '{readOnly}',
                                                store: configs.getProdutos().cbenef
                                            }
                                        },
                                        {
                                            flex: 1,
                                            xtype: 'combobox',
                                            fieldLabel: 'Cód Benef Região1',
                                            reference: 'cbenefrg1',
                                            proximoFoco: 'cbenefrg2',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.SALDOS_BENEFICIO01}',
                                                readOnly: '{readOnly}',
                                                store: configs.getProdutos().cbenef
                                            }
                                        },
                                        {
                                            flex: 1,
                                            xtype: 'combobox',
                                            fieldLabel: 'Cód Benef Região2',
                                            reference: 'cbenefrg2',
                                            proximoFoco: 'saldocstorigem',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.SALDOS_BENEFICIO02}',
                                                readOnly: '{readOnly}',
                                                store: configs.getProdutos().cbenef
                                            }
                                        }                                        
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '0 0 0 10',
                            padding: '10 10 10 10',
                            flex: 1,
                            defaultType: 'fieldcontainer',
                            layout: 'fit',
                            items: [
                                {                              
                                    items: [
                                        {
                                            
                                            xtype: 'combobox',
                                            fieldLabel: 'Origem Produto',
                                            reference: 'saldocstorigem',
                                            proximoFoco: 'saldocstlocal',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.TABELA_ORIGEM}',
                                                store: configs.getProdutos().origem,
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            
                                            xtype: 'combobox',
                                            fieldLabel: 'CST Local',
                                            reference: 'saldocstlocal',
                                            proximoFoco: 'saldocstoutros',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.TABELA_LOCAL}',
                                                store: configs.getProdutos().cstlocal, 
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            
                                            xtype: 'combobox',
                                            fieldLabel: 'CST Outros',
                                            reference: 'saldocstoutros',
                                            proximoFoco: 'aliquotapis',
                                            forceSelection: true,
                                            displayField: 'field2',
                                            editable: false,                                    
                                            bind: {
                                                value: '{model.TABELA_OUTROS}',
                                                store: configs.getProdutos().cstoutros,
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
                            width: 410, //390
                            margin: '0 10 10 10',
                            padding: '10 10 10 10',
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            items: [
                                {
                                    items: [
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            flex: false,
                                            width: 90,
                                            fieldLabel: '%Aliq PIS',
                                            reference: 'aliquotapis',
                                            proximoFoco: 'redulocal',
                                            bind: {
                                                value: '{model.SALDOS_ALIQUOTAPIS}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            decimalPrecision: 3,
                                            hideTrigger: true,
                                            flex: false,
                                            width: 90,
                                            fieldLabel: '% Base Local',
                                            reference: 'redulocal',
                                            proximoFoco: 'reduregiI',
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },        
                                            bind: {
                                                value: '{model.SALDOS_BASELC}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            decimalPrecision: 3,
                                            hideTrigger: true,
                                            flex: false,
                                            width: 100,
                                            fieldLabel: '% Base Região1',
                                            reference: 'reduregiI',
                                            proximoFoco: 'reduregiII',
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },        
                                            bind: {
                                                value: '{model.SALDOS_BASE01}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'numberfield',
                                            submitLocaleSeparator: false,
                                            decimalSeparator: ',',
                                            decimalPrecision: 3,
                                            hideTrigger: true,
                                            flex: false,
                                            width: 100,
                                            fieldLabel: '% Base Região2',
                                            reference: 'reduregiII',
                                            proximoFoco: 'aliqcofins',
                                            fieldStyle: {
                                                textAlign: 'right'
                                            },
                                            bind: {
                                                value: '{model.SALDOS_BASE02}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            flex: false,
                                            width: 90,
                                            fieldLabel: '%Aliq COFINS',
                                            reference: 'aliqcofins',
                                            proximoFoco: 'icmsregiaoI',
                                            bind: {
                                                value: '{model.SALDOS_ALIQUOTACOFINS}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            flex: false,
                                            width: 90,
                                            fieldLabel: '%Icms Local',
                                            reference: 'icmslocal',
                                            proximoFoco: 'icmsregiaoI',
                                            bind: {
                                                value: '{model.SALDOS_ICMSLC}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            flex: false,
                                            width: 100,
                                            fieldLabel: '%Icms Região1',
                                            reference: 'icmsregiaoI',
                                            proximoFoco: 'icmsregiaoII',
                                            bind: {
                                                value: '{model.SALDOS_ICMS01}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            flex: false,
                                            width: 100,
                                            fieldLabel: '%Icms Região2',
                                            reference: 'icmsregiaoII',
                                            proximoFoco: 'save',
                                            bind: {
                                                value: '{model.SALDOS_ICMS02}',
                                                readOnly: '{readOnly}'
                                            }
                                        }
                                    ]
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
