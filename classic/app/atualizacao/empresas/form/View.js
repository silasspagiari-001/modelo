Ext.define('SamosAdmin.atualizacao.empresas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formempresas',

    title: 'Empresa',

    requires: [
        'SamosAdmin.atualizacao.empresas.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir',
        'Sefaz'        
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Dados Básicos',
                    items: [
                        {
                            items: [
                                {
                                    width: 72,
                                    flex: false,
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
                                    width: 67,
                                    flex: false,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.EMPRESAS_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    flex: 2.5,
                                    reference: 'cnpj',
                                    proximoFoco: 'inscricao',
                                    fieldLabel: 'CPF/CNPJ',
                                    bind: {
                                        value: '{model.EMPRESAS_CPFCNPJ}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    maxLength: 15,
                                    reference: 'inscricao',
                                    proximoFoco: 'municipal',
                                    fieldLabel: 'Inscrição',
                                    bind: {
                                        value: '{model.EMPRESAS_INSCRICAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    maxLength: 15,
                                    reference: 'municipal',
                                    proximoFoco: 'email',
                                    fieldLabel: configs.getProdutos().montagemProdutos ? 'Gerente' : 'Municipal',
                                    bind: {
                                        value: '{model.EMPRESAS_MUNICIPAL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 3,
                                    maxLength: 50,
                                    reference: 'email',
                                    xtype: 'samoswidgets-textlower',
                                    proximoFoco: 'nome',
                                    fieldLabel: 'Email',
                                    bind: {
                                        value: '{model.EMPRESAS_EMAIL}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    width: 145,
                                    flex: false,
                                    fieldLabel: 'Cadastro',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    fieldLabel: 'Cadastro',
                                    bind: {
                                        value: '{model.EMPRESAS_CADASTRO}',
                                    },
                                    xtype: 'datefield'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 12,
                                    fieldLabel: 'Razao Social',
                                    reference: 'nome',
                                    proximoFoco: 'telefone',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) ____-____',
                                    flex: false,
                                    width: 145,
                                    fieldLabel: 'Telefone Fixo',
                                    reference: 'telefone',
                                    proximoFoco: 'celular',
                                    bind: {
                                        value: '{model.EMPRESAS_TELEFONE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    flex: false,
                                    width: 145,
                                    fieldLabel: 'Celular',
                                    reference: 'celular',
                                    proximoFoco: 'fantasia',
                                    bind: {
                                        value: '{model.EMPRESAS_CELULAR}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 12,
                                    fieldLabel: 'Fantasia',
                                    reference: 'fantasia',
                                    proximoFoco: 'pagina',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_FANTASIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 12,
                                    fieldLabel: 'Página',
                                    xtype: 'samoswidgets-textlower',                                    
                                    reference: 'pagina',
                                    proximoFoco: 'empresaregiao',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_PAGINA}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'ICMS 12% (UFs separados por virgula)',
                                    reference: 'empresaregiao',
                                    proximoFoco: configs.getClientName() == 'prudenmoveis' ? 'freteurb' : 'cnae',
                                    maxLength: 20,
                                    bind: {
                                        value: '{model.EMPRESAS_REGIAO12}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Valor Mín. Entrega Urb',
                                    reference: 'minentregaurb',
                                    proximoFoco: 'minentregasub',
                                    hidden: configs.getClientName() != 'prudenmoveis',                                    
                                    bind: {
                                        value: '{model.MINENTREGAURB}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Valor Mín. Entrega Sub',
                                    reference: 'minentregasub',
                                    proximoFoco: 'freteurb',
                                    hidden: configs.getClientName() != 'prudenmoveis',                                    
                                    bind: {
                                        value: '{model.MINENTREGASUB}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Frete Urbano',
                                    reference: 'freteurb',
                                    proximoFoco: 'fretesub',
                                    hidden: configs.getClientName() != 'prudenmoveis',                                    
                                    bind: {
                                        value: '{model.FRETEURB}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Frete Suburbano',
                                    reference: 'fretesub',
                                    proximoFoco: 'fretesub',
                                    hidden: configs.getClientName() != 'prudenmoveis',
                                    bind: {
                                        value: '{model.FRETESUB}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tabela Montagem',
                                    reference: 'tabelamontagem',
                                    proximoFoco: 'icmscom',
                                    forceSelection: true,
                                    hidden: configs.getClientName() != 'prudenmoveis',                                    
                                    bind: {
                                        value: '{model.TABMONTAGEM}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ["A", 'Tabela A'],
                                            ["B", 'Tabela B'],
                                            ["C", 'Tabela C']
                                        ]
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: '% Credito ICMS Com',
                                    reference: 'icmscom',
                                    proximoFoco: 'icmsind',
                                    hidden: configs.getClientName() != 'lislais',
                                    bind: {
                                        value: '{model.ALIQCOM}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 148,
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: '% Credito ICMS Ind',
                                    reference: 'icmsind',
                                    hidden: configs.getClientName() != 'lislais',                                    
                                    proximoFoco: 'cep',
                                    bind: {
                                        value: '{model.ALIQIND}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Localização',
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
                                        ['EMPRESAS_CEP',       'CEPS_CEP'],
                                        ['EMPRESAS_ENDERECO',  'CEPS_ENDERECO'],
                                        ['EMPRESAS_BAIRRO',    'CEPS_BAIRRO'],
                                        ['CIDADES_NOME',       'CEPS_CIDADE'],
                                        ['EMPRESAS_ID_CIDADES','CEPS_ID'],                                        
                                        ['CIDADES_ESTADO',     'CEPS_ESTADO'],
                                        ['CIDADES_IBGE',       'CEPS_IBGE']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',                                        
                                        value: '{model.EMPRESAS_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'onSairCampoCep'
                                    }
                                },                                
                                {
                                    flex: 9,
                                    fieldLabel: 'Cidade',
                                    reference: 'cidade',
                                    bind:'{model.CIDADES_NOME}',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                },
                                {
                                    flex: 1.5,
                                    fieldLabel: 'UF',
                                    reference: 'estado',                                    
                                    bind: '{model.CIDADES_ESTADO}',
                                    ui: 'field-readonly',
                                    readOnly: true
                                },
                                {
                                    hidden: true,
                                    bind: '{model.CIDADES_IBGE}'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 13.5,
                                    fieldLabel: 'Endereço',
                                    maxLength: 40,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.EMPRESAS_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1.5,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'bairro',
                                    maxLength: 5,
                                    bind: {
                                        value: '{model.EMPRESAS_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 9.5,
                                    fieldLabel: 'Bairro',
                                    reference: 'bairro',
                                    proximoFoco: 'portador',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Parâmetros',
                    items: [
                        {
                            items: [
                                {
                                    width: 415,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Portador',
                                    tabela: 'portadores',
                                    reference: 'portador',
                                    proximoFoco: 'aliquota',
                                    buscarPor: 'Contéudo',
                                    callbackFn: 'validarPortador',
                                    associations: [
                                        ['PORTADORES_NOME',        'PORTADORES_NOME'],
                                        ['EMPRESAS_ID_PORTADORES', 'PORTADORES_ID']
                                    ],
                                    bind: {
                                        value: '{model.PORTADORES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 55,
                                    readOnly: true,
                                    fieldLabel: 'Código',
                                    fieldStyle: 'text-align: right;',
                                    bind: {
                                        value: '{model.EMPRESAS_ID_PORTADORES}'
                                    }
                                },
                                {
                                    width: 115,
                                    flex: false,
                                    fieldLabel: 'Atraso Cliente',
                                    reference: 'atrasocliente',
                                    proximoFoco: 'diasatraso',
                                    bind: {
                                        value: '{model.EMPRESAS_ANALISACLIENTE}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Analisar ',
                                    checked: true
                                },
                                {
                                    xtype: 'numberfield',
                                    flex: false,
                                    width: 80,
                                    reference: 'diasatraso',
                                    proximoFoco: 'aliquota',
                                    enableKeyEvents: true,
                                    minValue: 0,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    allowDecimals: false,
                                    fieldLabel: 'Dias atraso',
                                    bind: {
                                        value: '{model.EMPRESAS_ATRASOCLIENTE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 382,
                                    xtype: 'combobox',
                                    fieldLabel: 'Regime Tributário e IBS/CBS',
                                    reference: 'simples',
                                    proximoFoco: 'aliquota',
                                    forceSelection: true,
                                    readOnly: true,
                                    bind: {
                                        value: '{model.EMPRESAS_SIMPLES}',
//                                      readOnly: '{readOnly}',
                                        store: [
                                            // Esses são os antigos que em breve serão removidos
                                            ['T', 'Simples Nacional'],
                                            [0, 'Simples Nacional'],
                                            ['F', 'Regime Normal'],
                                            [1, 'Regime Normal'],
                                            [2, 'Simples Excesso Receita'],
                                            [3, 'Regime Especial']                                            
                                            // Abaixo Novos que incluem IBS/CBS
                                            ['A', 'Simples Nacional / IBS-CBS Simples Nacional'],
                                            ['B', 'Simples Nacional / IBS-CBS Regime Regular'],
                                            ['C', 'Simples Nacional - Excesso de Sublimite'],
                                            ['D', 'Regime Normal']
                                        ]
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#0,000',                                    
                                    width: 150,
                                    flex: false,
                                    fieldLabel: 'Aliq Crédito Simples',
                                    reference: 'aliquota',
                                    proximoFoco: 'loginemail',
                                    bind: {
                                        value: '{model.EMPRESAS_ALIQUOTA}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 3,
                                    fieldLabel: 'Login do Email',
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'loginemail',
                                    proximoFoco: 'senhaemail',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_LOGIN}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    flex: 2,
                                    fieldLabel: 'Senha do Email',
                                    reference: 'senhaemail',
                                    proximoFoco: 'smtpemail',
                                    disableCase: true,
                                    maxLength: 15,
                                    inputType: 'text',
                                    fieldStyle: '-webkit-text-security: disc;',
                                    bind: {
                                        value: '{model.EMPRESAS_PASSWORD}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 5.05,
                                    fieldLabel: 'Smtp do Email',
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'smtpemail',
                                    proximoFoco: 'impressao',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_SMTP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    flex: false,
                                    width: 115,
                                    fieldLabel: 'Autentica',
                                    reference: 'autentica',
                                    proximoFoco: 'impressao',
                                    bind: {
                                        value: '{model.EMPRESAS_AUTENTICA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 115,
                                    fieldLabel: 'Caixa',
                                    reference: 'caixa',
                                    proximoFoco: 'ambiente',
                                    bind: {
                                        value: '{model.EMPRESAS_CAIXA}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: false,
                                    width: 150,
                                    xtype: 'combobox',
                                    fieldLabel: 'Impressão',
                                    reference: 'impressao',
                                    proximoFoco: 'certificado',
                                    forceSelection: true,
                                    bind: {
                                        value: '{model.EMPRESAS_IMPRESSAO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            [0, 'Visualizar'],
                                            [1, 'Matricial'],
                                            [2, 'Ambos']
                                        ]
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1.95,
                                    xtype: 'samoswidgets-textlower',                                    
                                    fieldLabel: 'Certificado',
                                    reference: 'certificado',
                                    proximoFoco: 'senha',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_CERTIFICADO}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Senha do Certificado',
                                    reference: 'senha',
                                    proximoFoco: 'cscnfc',
                                    maxLength: 15,
                                    inputType: 'text',
                                    fieldStyle: '-webkit-text-security: disc;',
                                    bind: {
                                        value: '{model.EMPRESAS_SENHA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    xtype: 'samoswidgets-textlower',
                                    fieldLabel: 'CSC NFC',
                                    reference: 'cscnfc',
                                    proximoFoco: 'ambiente',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.EMPRESAS_CSC}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    flex: false,
                                    width: 150,
                                    xtype: 'combobox',
                                    fieldLabel: 'Ambiente',
                                    reference: 'ambiente',
                                    proximoFoco: 'save',
                                    forceSelection: true,
                                    bind: {
                                        value: '{model.EMPRESAS_AMBIENTE}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['H', 'Homologação'],
                                            ['P', 'Produção'],
                                            ['C', 'Contingência']
                                        ]
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
