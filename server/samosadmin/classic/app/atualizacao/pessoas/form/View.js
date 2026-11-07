Ext.define('SamosAdmin.atualizacao.pessoas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formpessoas',

    title: 'Pessoa',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.ViewController',
        'SamosAdmin.atualizacao.pessoas.form.formulatransporte.View',
        'SamosAdmin.atualizacao.pessoas.form.precos.View',
        'SamosAdmin.atualizacao.pessoas.form.documentos.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir',
        'Sefaz',
        'Crédito',
        'Preços',
        'Documentos',
        'Propriedades',
        'Assistências',
        'Parâmetros Transporte',
        'Parâmetros Fornecedor',
        'Incluir Pedido',
        'Incluir Orçamento'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    constructor: function () {
        let primeiroBloco;
      
        if(configs.getPessoas().foto) {
            primeiroBloco = {
                layout: 'hbox',
                items: [
                    {
                        xtype: 'container',
                        style: 'border:1px solid #c5c5c5 !important;',
                        margin: '10 0 10 0',
                        padding: '10 10 10 5', 
                        flex: 1,
                        defaultType: 'fieldcontainer',
                        layout: 'fit',
                        items: [
                            {
                                items: [
                                    {
                                        width: 80,
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
                                        width: 75,
                                        fieldLabel: 'Status',
                                        reference: 'status',
                                        bind: {
                                            value: '{model.PESSOAS_STATUS}',
                                            readOnly: '{readOnly}'
                                        },
                                        xtype: 'checkbox',
                                        inputValue: 'T',
                                        uncheckedValue: 'F',
                                        boxLabel: 'Ativo',
                                        checked: true
                                    },
                                    {
                                        width: 160,
                                        xtype: 'samoswidgets-maskfield',
                                        textMask: [
                                            '___.___.___-__',
                                            '__.___.___/____-__'
                                        ],
                                        fieldLabel: 'CPF/CNPJ',
                                        reference: 'cpf',
                                        proximoFoco: 'nome',
                                        bind: {
                                            value: '{model.PESSOAS_CPFCNPJ}',
                                            readOnly: '{readOnly}'
                                        },
                                        listeners: {
                                            blur: 'onSairCampoCPFCNPJ',
                                            keydown: 'verificarCPFCNPJExistente'
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        flex: 1,
                                        fieldLabel: 'Nome',
                                        reference: 'nome',
                                        maxLength: 50,
                                        bind: {
                                            proximoFoco: '{usarCampoRG ? "registro_geral" : "inscricao_tipo"}',
                                            value: '{model.PESSOAS_NOME}',
                                            readOnly: '{readOnly || tipoRestrito}'
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        width: 135,
                                        fieldLabel: 'RG',
                                        reference: 'registro_geral',
                                        proximoFoco: 'inscricao_tipo',
                                        maxLength: 15,
                                        hidden: !configs.getPessoas().usarCampoRG,
                                        bind: {
                                            value: '{model.REGISTRO_GERAL}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        width: 135,
                                        fieldLabel: 'Inscrição Estadual',
                                        reference: 'inscricao_tipo',
                                        proximoFoco: 'inscricao_suframa',
                                        maxLength: 15,
                                        bind: {
                                            value: '{model.PESSOAS_INSCRICAO}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        xtype: 'textfield',
                                        width: 135,
                                        fieldLabel: 'Inscrição SUFRAMA',
                                        reference: 'inscricao_suframa',
                                        proximoFoco: 'nomeficticio_rg',
                                        maxLength: 15,
                                        hidden: (configs.getPessoas().hideSuframa || false),                                        
                                        bind: {
                                            value: '{model.PESSOAS_SUFRAMA}',
                                            readOnly: '{readOnly}'
                                        }
                                    }
                                ]
                            },
                            {
                                items: [
                                    {
                                        width: 155,
                                        xtype: 'combobox',
                                        fieldLabel: 'Tipo',
                                        reference: 'tipo_sexo',
                                        proximoFoco: 'categoria',
                                        forceSelection: true,
                                        editable: false,                                            
                                        displayField: 'field2',
                                        store: configs.getPessoas().tipos,
                                        bind: {
                                            value: '{model.PESSOAS_TIPO}',
                                            readOnly: '{readOnly}'
                                        },
                                        listeners: {
                                            change: 'onMudarTipoPessoa'
                                        }
                                    },
                                    {
                                        width: 160,
                                        xtype: 'combobox',
                                        fieldLabel: 'Categoria',
                                        reference: 'categoria',
                                        proximoFoco: 'nomeficticio_rg',
                                        forceSelection: true,
                                        editable: false,                                            
                                        displayField: 'field2',
                                        bind: {
                                            value: '{model.PESSOAS_CATEGORIA}',
                                            readOnly: '{readOnly}',
                                            store: [
                                                ['0', 'Contribuinte'],
                                                ['1', 'Não Contribuinte'],
                                                ['4', 'Produtor Rural PJ'],
                                                ['2', 'Isento'],
                                                ['3', 'Exportação'],
                                                ['5', 'Órgão Público']
                                            ]
                                        },
                                        listeners: {
                                            change: 'onCategoriaChange'
                                        }
                                    },
                                    {
                                        flex: 1,
                                        maxLength: 50,
                                        xtype: 'textfield',                                        
                                        fieldLabel: 'Nome Fantasia',
                                        reference: 'nomeficticio_rg',
                                        proximoFoco: 'nascimento',
                                        bind: {
                                            value: '{model.PESSOAS_FANTASIA}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        width: 130,
                                        fieldLabel: 'Nascimento',
                                        reference: 'nascimento',
                                        proximoFoco: 'cep',
                                        bind: {
                                            value: '{model.PESSOAS_NASCIMENTO}',
                                            readOnly: '{readOnly}'
                                        },
                                        xtype: 'datefield'
                                    },
                                    {
                                        width: 60,
                                        xtype: 'combobox',
                                        fieldLabel: 'Classe',
                                        reference: 'classe',
                                        proximoFoco: 'cep',
                                        forceSelection: true,
                                        editable: false,                                            
                                        hidden: configs.getClientName() != 'racaforte',
                                        displayField: 'field2',
                                        bind: {
                                            value: '{model.CLASSE_CADASTRO}',
                                            readOnly: '{readOnly}',
                                            store: [
                                                ['A', 'A'],                                                
                                                ['E', 'E'],
                                                ['M', 'M'],
                                                ['D', 'D']
                                            ]
                                        }
                                    },
                                    {
                                        width: 160,
                                        xtype: 'combobox',
                                        fieldLabel: 'Partida na NF-e',
                                        reference: 'partidanfe',
                                        proximoFoco: 'cep',
                                        forceSelection: true,
                                        editable: false,                                            
                                        hidden: configs.getClientName() != 'racaforte',
                                        displayField: 'field2',
                                        bind: {
                                            value: '{model.PARTIDA_NFE}',
                                            readOnly: '{readOnly}',
                                            store: [
                                                ['T', 'Sim'],
                                                ['F', 'Não']
                                            ]
                                        }
                                    },
                                    {
                                        width: 135,
                                        fieldLabel: 'Cadastro',
                                        reference: 'cadastro',
                                        proximoFoco: 'tipo',
                                        ui: 'field-readonly',
                                        readOnly: true,
                                        bind: {
                                            value: '{model.PESSOAS_CADASTRO}',
                                        },
                                        xtype: 'datefield'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        xtype: 'container',
                        style: 'border:1px solid #c5c5c5 !important;',
                        margin: '10 10 10 10',
                        defaultType: 'fieldcontainer',
                        layout: 'fit',
                        items: [
                            {                              
                                items: [
                                    {
                                        xtype: 'image',
                                        margin: '5 5 5 5',
                                        height: 105,
                                        width: 79,
                                        alt: 'profile-picture',
                                        bind: {
                                            src: '{urlImage}'
                                        },
                                        listeners: {
                                            render: 'listenClickImg'
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        } else {
            primeiroBloco = {
                items: [
                    {
                        items: [
                            {
                                width: 80,
                                fieldLabel: 'Código',
                                reference: 'codigo',
                                ui: 'field-readonly',
                                fieldStyle: 'text-align:right;',
                                readOnly: true,
                                bind: {
                                    value: '{modelId}'
                                }
                            },
                            {
                                width: 75,
                                fieldLabel: 'Status',
                                reference: 'status',
                                xtype: 'checkbox',
                                inputValue: 'T',
                                uncheckedValue: 'F',
                                boxLabel: 'Ativo',
                                checked: true,
                                bind: {
                                    value: '{model.PESSOAS_STATUS}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                width: 160,
                                xtype: 'samoswidgets-maskfield',
                                textMask: [
                                    '___.___.___-__',
                                    '__.___.___/____-__'
                                ],
                                fieldLabel: 'CPF/CNPJ',
                                reference: 'cpf',
                                proximoFoco: 'nome',
                                bind: {
                                    value: '{model.PESSOAS_CPFCNPJ}',
                                    readOnly: '{readOnly}'
                                },
                                listeners: {
                                    blur: 'onSairCampoCPFCNPJ',                                                                
                                    keydown: 'verificarCPFCNPJExistente'
                                }
                            },
                            {
                                xtype: 'textfield',
                                flex: 1,
                                fieldLabel: 'Nome',
                                reference: 'nome',
                                maxLength: 50,
                                bind: {
                                    proximoFoco: '{usarCampoRG ? "registro_geral" : "inscricao_tipo"}',
                                    value: '{model.PESSOAS_NOME}',
                                    readOnly: '{readOnly || tipoRestrito}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                width: 135,
                                fieldLabel: 'RG',
                                reference: 'registro_geral',
                                proximoFoco: 'inscricao_tipo',
                                maxLength: 15,
                                hidden: !configs.getPessoas().usarCampoRG,
                                bind: {
                                    value: '{model.REGISTRO_GERAL}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                width: 135,
                                fieldLabel: 'Inscrição Estadual',
                                reference: 'inscricao_tipo',
                                proximoFoco: 'inscricao_suframa',
                                maxLength: 15,
                                bind: {
                                    value: '{model.PESSOAS_INSCRICAO}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'textfield',
                                width: 135,
                                fieldLabel: 'Inscrição SUFRAMA',
                                reference: 'inscricao_suframa',
                                proximoFoco: 'tipo_sexo',
                                maxLength: 15,
                                hidden: (configs.getPessoas().hideSuframa || false),                                
                                bind: {
                                    value: '{model.PESSOAS_SUFRAMA}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    },
                    {
                        items: [
                            {
                                width: 155,
                                xtype: 'combobox',
                                fieldLabel: 'Tipo',
                                reference: 'tipo_sexo',
                                proximoFoco: 'categoria',
                                forceSelection: true,
                                editable: false,                                            
                                displayField: 'field2',
                                store: configs.getPessoas().tipos,
                                bind: {
                                    value: '{model.PESSOAS_TIPO}',
                                    readOnly: '{readOnly}'
                                },
                                listeners: {
                                    change: 'onMudarTipoPessoa'
                                }
                            },
                            {
                                width: 160,
                                xtype: 'combobox',
                                fieldLabel: 'Categoria',
                                reference: 'categoria',
                                proximoFoco: configs.getClientName() == 'racaforte' ? 'emailc' : 'nomeficticio_rg',
                                forceSelection: true,
                                editable: false,                                            
                                displayField: 'field2',
                                bind: {
                                    value: '{model.PESSOAS_CATEGORIA}',
                                    readOnly: '{readOnly}',
                                    store: [
                                        ['0', 'Contribuinte'],
                                        ['1', 'Não Contribuinte'],
                                        ['4', 'Produtor Rural PJ'],
                                        ['2', 'Isento'],
                                        ['3', 'Exportação'],
                                        ['5', 'Órgão Público']                                        
                                    ]
                                },
                                listeners: {
                                    change: 'onCategoriaChange'
                                }
                            },
                            {
                                flex: 1,
                                maxLength: 50,
                                xtype: 'textfield',                                
                                fieldLabel: (configs.getPessoas().labelFantasia || 'Nome Fantasia'),
                                reference: 'nomeficticio_rg',
                                proximoFoco: 'nascimento',
                                bind: {
                                    hidden: '{fantasiaIsMail}',
                                    value: '{model.PESSOAS_FANTASIA}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                flex: 1,
                                maxLength: 50,
                                xtype: 'samoswidgets-textlower',
                                fieldLabel: configs.getPessoas().labelFantasia || 'E-mail',
                                reference: 'emailc',
                                proximoFoco: 'nascimento',
                                bind: {
                                    hidden: '{!fantasiaIsMail}',
                                    value: '{model.PESSOAS_FANTASIA}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                width: 135,
                                fieldLabel: 'Nascimento',
                                reference: 'nascimento',
                                proximoFoco: 'cep',
                                bind: {
                                    value: '{model.PESSOAS_NASCIMENTO}',
                                    readOnly: '{readOnly}'
                                },
                                xtype: 'datefield'
                            },
                            {
                                width: 135,
                                fieldLabel: 'Admissão',
                                reference: 'admissao',
                                proximoFoco: 'cep',
                                bind: {
                                    hidden:'{!isColaboradorPrudenMoveis}',
                                    value: '{model.PESSOAS_CADASTRO}',
                                    readOnly: '{readOnly}'
                                },
                                xtype: 'datefield'
                            },
                            {
                                width: 60,
                                xtype: 'combobox',
                                fieldLabel: 'Classe',
                                reference: 'classe',
                                proximoFoco: 'cep',
                                forceSelection: true,
                                editable: false,                                            
                                hidden: configs.getClientName() != 'racaforte',
                                displayField: 'field2',
                                bind: {
                                    value: '{model.CLASSE_CADASTRO}',
                                    readOnly: '{readOnly}',
                                    store: [
                                        ['A', 'A'],                                                
                                        ['E', 'E'],
                                        ['M', 'M'],
                                        ['D', 'D']
                                    ]
                                }
                            },
                            {
                                width: 110,
                                xtype: 'combobox',
                                fieldLabel: 'Partida na NF-e',
                                reference: 'partidanfe',
                                proximoFoco: 'cep',
                                forceSelection: true,
                                editable: false,                                            
                                hidden: configs.getClientName() != 'racaforte',
                                displayField: 'field2',
                                bind: {
                                    value: '{model.PARTIDA_NFE}',
                                    readOnly: '{readOnly}',
                                    store: [
                                        ['T', 'Sim'],
                                        ['F', 'Não']
                                    ]
                                }
                            },
                            {
                                width: 135,
                                fieldLabel: 'Cadastro',
                                reference: 'cadastro',
                                proximoFoco: 'tipo',
                                ui: 'field-readonly',
                                readOnly: true,
                                bind: {
                                    hidden:'{isColaboradorPrudenMoveis}', 
                                    value: '{model.PESSOAS_CADASTRO}'
                                },
                                xtype: 'datefield'
                            }
                        ]
                    }
                ]
            }
        }
        
        Ext.apply(this, {
            formgroups: [
                primeiroBloco,               
                {
                    title: (configs.getClientName().match(/moveis/) ? 'Endereço de Entrega' : 'Localização e Contato'),
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    width: 130,
                                    fieldLabel: 'CEP',
                                    reference: 'cep',
                                    naoFocarAposPesquisar: true,
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['PESSOAS_CEP',       'CEPS_CEP'],
                                        ['PESSOAS_ENDERECO',  'CEPS_ENDERECO'],
                                        ['PESSOAS_BAIRRO',    'CEPS_BAIRRO'],
                                        ['CIDADES_NOME',      'CEPS_CIDADE'],
                                        ['PESSOAS_ID_CIDADES','CEPS_ID'],                                        
                                        ['CIDADES_ESTADO',    'CEPS_ESTADO'],
                                        ['CIDADES_IBGE',      'CEPS_IBGE']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',                                        
                                        value: '{model.PESSOAS_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca',
                                        blur: 'onSairCampoCep',
                                        validitychange: function (txt) {
                                            txt.clearInvalid();
                                        }
                                    }
                                },                                
                                {
                                    flex: 20,
                                    fieldLabel: 'Cidade',
                                    tabela: 'cidades',
                                    reference: 'cidade',
                                    proximoFoco: 'numero',
                                    readOnly: true,
                                    ui: 'field-readonly',                                
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    width: 60,
                                    fieldLabel: 'UF',
                                    reference: 'uf',
                                    maxLength: 2,
                                    proximoFoco: 'numero',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    hidden: true,
                                    reference: 'idcidades',
                                    bind: {
                                        value: '{model.PESSOAS_ID_CIDADES}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    hidden: true,
                                    reference: 'ibge',
                                    bind: {
                                        value: '{model.CIDADES_IBGE}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PESSOAS_ID_PAISES}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PESSOAS_ID_EMPRESAS}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    xtype: 'textfield',
                                    maxLength: 50,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.PESSOAS_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Número',
                                    xtype: 'textfield',                                    
                                    reference: 'numero',
                                    proximoFoco: 'bairro',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.PESSOAS_NUMERO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    width: 500,
                                    fieldLabel: 'Bairro',
                                    xtype: 'textfield',
                                    reference: 'bairro',
                                    proximoFoco: 'celular',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PESSOAS_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'copiarParaCobranca'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',                                        
                                        '_____-____',
                                        '(__) ____-____',                                        
                                        '(__) _____-____'
                                    ],
                                        width: 130,
                                    fieldLabel: 'Celular',
                                    reference: 'celular',
                                    proximoFoco: 'telefone',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PESSOAS_CELULAR}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'copiarParaCobranca',
                                        keydown: 'copiarParaCobranca'
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
                                    fieldLabel: (configs.getClientName() == 'prudenmoveis' ? 
                                                'Recado' : 'Fone adicional'),
                                    reference: 'telefone',
                                    proximoFoco: 'email',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PESSOAS_TELEFONE}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'copiarParaCobranca',
                                        keydown: 'copiarParaCobranca'
                                    }
                                },
                                {
                                    width: 105,
                                    xtype: 'combobox',
                                    fieldLabel: 'Envio XML',
                                    reference: 'xmlauto',
                                    proximoFoco: 'email',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    hidden: configs.getMovimentos().envioAutomaticoXML,
                                    bind: {
                                        value: '{model.XML_AUTOMATICO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['T', 'Auto'],
                                            ['F', 'Manual']
                                        ]
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Email',
                                    reference: 'email',
                                    proximoFoco: 'cepcobranca',
                                    maxLength: 50,
                                    xtype: 'samoswidgets-textlower',
                                    bind: {
                                        value: '{model.PESSOAS_EMAIL}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {    
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        },
                                        blur: function () {
                                            if(!this.getValue()) {
                                                this.setValue('email@provedor.com.br');
                                            }
                                        }
                                    }
                                },
                                {
                                    width: 500,
                                    fieldLabel: configs.getPessoas().labelPagina,
                                    reference: 'profissao_pagina', 
                                    proximoFoco: 'cepcobranca',
                                    maxLength: 50,
                                    bind: {
                                        hidden: '{pageIsMail}',
                                        value: '{model.PESSOAS_PAGINA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 500,
                                    fieldLabel: configs.getPessoas().labelPagina,
                                    reference: 'profissao_pagina', 
                                    proximoFoco: 'cepcobranca',
                                    maxLength: 50,
                                    xtype: 'samoswidgets-textlower',                                    
                                    bind: {
                                        hidden: '{!pageIsMail}',
                                        value: '{model.PESSOAS_PAGINA}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Endereço de Cobrança/Entrega',
                    bind: {
                        hidden: '{hideCobranca}'
                    },
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    width: 130,
                                    fieldLabel: 'CEP',
                                    reference: 'cepcobranca',
                                    proximoFoco: 'numerocobranca',                                    
                                    naoFocarAposPesquisar: true,
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['PESSOAS_CEPCOBRANCA',        'CEPS_CEP'],
                                        ['PESSOAS_ENDERECOCOBRANCA',   'CEPS_ENDERECO'],
                                        ['PESSOAS_BAIRROCOBRANCA',     'CEPS_BAIRRO'],
                                        ['CIDADES_NOMECOBRANCA',       'CEPS_CIDADE'],
                                        ['PESSOAS_ID_CIDADESCOBRANCA', 'CEPS_ID'],                                        
                                        ['CIDADES_ESTADOCOBRANCA',     'CEPS_ESTADO'],
                                        ['CIDADES_IBGECOBRANCA',       'CEPS_IBGE']
                                    ],
                                    bind: {
                                        value: '{model.PESSOAS_CEPCOBRANCA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                       blur: 'onSairCampoCepCobranca' 
                                    }
                                },
                                {
                                    flex: 20, // aqui deixar igual acima
                                    fieldLabel: 'Cidade',
                                    reference: 'cidadecobranca',
                                    proximoFoco: 'numerocobranca',
                                    readOnly: true,
                                    ui: 'field-readonly',                                                                    
                                    bind: {
                                        value: '{model.CIDADES_NOMECOBRANCA}',
                                    }
                                },
                                {
                                    width: 60,
                                    fieldLabel: 'UF',
                                    reference: 'ufcobranca',
                                    proximoFoco: 'numerocobranca',
                                    maxLength: 2,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_ESTADOCOBRANCA}'
                                    }
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 50,
                                    reference: 'enderecocobranca',
                                    proximoFoco: 'numerocobranca',
                                    bind: {
                                        value: '{model.PESSOAS_ENDERECOCOBRANCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Número',
                                    xtype: 'textfield',                                    
                                    reference: 'numerocobranca',
                                    proximoFoco: 'bairrocobranca',
                                    width: 120,
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.PESSOAS_NUMEROCOBRANCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Bairro',
                                    width: 500,
                                    reference: 'bairrocobranca',
                                    proximoFoco: 'celularcobranca',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PESSOAS_BAIRROCOBRANCA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    reference: 'idcidadescobranca',
                                    bind: {
                                        value: '{model.PESSOAS_ID_CIDADESCOBRANCA}'
                                    }
                                },
                                {
                                    hidden: true,
                                    reference: 'ibgecobranca',
                                    bind: {
                                        value: '{model.CIDADES_IBGECOBRANCA}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',
                                        '_____-____',
                                        '(__) ____-____',                                        
                                        '(__) _____-____'
                                    ],
                                    width: 130,
                                    fieldLabel: 'Celular',
                                    reference: 'celularcobranca',
                                    proximoFoco: 'observacoes',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PESSOAS_CELULARCOBRANCA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {                                    
                                        blur: function () {
                                            if(this.getValue().slice(-3) == "_99") {
                                                this.setValue("99999999999");
                                            }
                                        }
                                    }
                                },
                                {
                                    width: 120,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo Endereço',
                                    reference: 'tipoendereco',
                                    proximoFoco: 'observacoes',
                                    forceSelection: true,
                                    editable: false,                                            
                                    hidden: configs.getPessoas().usarCampoRG,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.PESSOAS_TELEFONECOBRANCA}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['Cobranca', 'Cobrança'],
                                            ['Entrega',  'Entrega']
                                        ]
                                    }
                                },
                                {
                                    width: 85,
                                    fieldLabel: 'Dia Vcto Fixo',
                                    xtype: 'numberfield',                                    
                                    decimalPrecision: 0,
                                    hideTrigger: true,
                                    maxValue: 31,
                                    reference: 'vencimento',
                                    proximoFoco: 'observacoes',
                                    hidden: !configs.getPessoas().prazoEspecifico,
                                    bind: {
                                        value: '{model.VCTO_FIXO}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    fieldLabel: 'Ø',
                                    flex: 1,
                                    reference: 'livre1',
                                    hidden: configs.getPessoas().exibirVendedorPessoa,
                                    xtype: 'samoswidgets-textupper',
                                    readOnly: true,
                                    ui: 'field-readonly'                                    
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'usuarios',
                                    reference: 'vendedor',
                                    fieldLabel: 'Vendedor',
                                    proximoFoco: 'rsdescontos',
                                    naoFocarAposPesquisar: true,
                                    buscarPor: 'Genérica',
                                    hidden: !configs.getPessoas().exibirVendedorPessoa,
                                    associations: [
                                        ['USUARIOS_NOMEVENDEDOR', 'USUARIOS_NOME'],
                                        ['PESSOAS_ID_USUARIOS',   'USUARIOS_ID']
                                    ],
                                    bind: {
                                        readOnly: (configs.getUsuario().tipo != configs.getUsuarios().tipoVendedor) ? '{readOnly}' : true,
                                        value: '{model.USUARIOS_NOMEVENDEDOR}'
                                    }
                                },
                                {
                                    fieldLabel: 'Ø',
                                    width: 500,
                                    reference: 'livre2',
                                    xtype: 'samoswidgets-textupper',
                                    readOnly: true,
                                    ui: 'field-readonly'                                    
                                }
                            ]
                        }
                    ]
                },
                {
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 0 10 10',
                            padding: '10 5 10 10',
                            flex: 1,
                            defaultType: 'fieldcontainer',
                            layout: 'fit',
                            items: [
                                {
                                    items: [
                                        {
                                            height: 100,
                                            xtype: 'textarea',
                                            reference: 'observacoes',
                                            fieldLabel: 'Observações',
                                            proximoFoco: 'desconto',
                                            maxLength: 512,
                                            bind: {
                                                value: '{model.PESSOAS_OBSERVACOES}',
                                                readOnly: '{readOnly}'
                                            },
                                            anchor: '100%',
                                            grow  : true,
                                            width : '100%'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            xtype: 'container',
                            style: 'border:1px solid #c5c5c5 !important;',
                            margin: '10 10 10 10',
                            padding: '10 0 10 10',
                            width: 230, // 190
                            defaultType: 'fieldcontainer',
                            layout: 'vbox',
                            items: [
                                {                              
                                    items: [
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            width: 120,
                                            fieldStyle:'color:blue;',
                                            fieldLabel: '% Retenção IRRF',
                                            reference: 'retencao',
                                            proximoFoco: 'credito',
                                            bind: {
                                                value: '{model.PESSOAS_RETENCAO}',
                                                readOnly: '{readOnly}'
                                            }
                                        },
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            width: 82,
                                            fieldStyle:'color:blue;',
                                            fieldLabel: (configs.getPessoas().labelCredito || 'R$ Crédito'),
                                            reference: 'credito',
                                            proximoFoco: 'validade',
                                            bind: {
                                                value: '{model.PESSOAS_CREDITO}',
                                                readOnly: '{readOnlyPrivilegiado}'
                                            }
                                        }
                                    ]
                                },
                                {
                                    items: [
                                        {
                                            width: 120,
                                            fieldLabel: 'Validade',
                                            reference: 'validade',
                                            proximoFoco: 'desconto',
                                            bind: {
                                                value: '{model.PESSOAS_VALIDADE}',
                                                readOnly: '{readOnly}'
                                            },
                                            xtype: 'datefield'
                                        },
                                        {
                                            xtype: 'samoswidgets-textmoney',
                                            width: 82,
                                            fieldStyle:'color:blue;',
                                            fieldLabel: '% Desconto',
                                            reference: 'desconto',
                                            proximoFoco: 'save',
                                            bind: {
                                                value: '{model.PESSOAS_DESCONTO}',
                                                readOnly: '{readOnlyPrivilegiado}'
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Logs',
                    items: [
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Inclusão',
                                    maxLength: 50,
                                    reference: 'loginclusao',
                                    proximoFoco: 'logalteracao',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.PESSOAS_INCLUSAO}'
                                    }
    
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Alteração',
                                    maxLength: 50,
                                    reference: 'logalteracao',
                                    proximoFoco: 'logalteracao',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.PESSOAS_LOG}'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);

        Ext.defer( async()=>{
            const modelAberto = arguments[0].model,
                  cpfCnpj     = modelAberto.get('PESSOAS_CPFCNPJ'),
                  campoNascimento = this.lookupReference('nascimento');

             if(campoNascimento && campoNascimento.getRawValue() != '' ){
                //Troca o label do campo nascimento
                campoNascimento.setFieldLabel(  SamosUtils.String.isCpf( cpfCnpj ) ? 'Nascimento' : 'Abertura' );
             }
             
        }, 200, this);
    }
});
