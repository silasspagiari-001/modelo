Ext.define('SamosAdmin.atualizacao.portadores.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formportadores',

    title: 'Portador',

    requires: [
        'SamosAdmin.atualizacao.portadores.form.ViewModel'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir'
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
                                    bind: '{modelId}',
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
                                        value: '{model.PORTADORES_STATUS}',
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
                                    flex: 1.5,
                                    reference: 'cnpj',
                                    proximoFoco: 'email',
                                    textMask: '__.___.___/____-__',
                                    fieldLabel: 'CNPJ',
                                    bind: {
                                        value: '{model.PORTADORES_CPFCNPJ}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'verificarCPFCNPJExistente'
                                    }
                                },
                                {
                                    flex: 5,
                                    maxLength: 50,
                                    xtype: 'samoswidgets-textlower',
                                    reference: 'email',
                                    proximoFoco: 'nome',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Email',
                                    bind: {
                                        value: '{model.PORTADORES_EMAIL}',
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
                                        value: '{model.PORTADORES_CADASTRO}',
                                    },
                                    xtype: 'datefield'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 12,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: 'telefone',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PORTADORES_NOME}',
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
                                    proximoFoco: 'cep',
                                    bind: {
                                        value: '{model.PORTADORES_TELEFONE}',
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
                                    flex: false,
                                    width: 110,
                                    fieldLabel: 'CEP',
                                    reference: 'cep',
                                    naoFocarAposPesquisar: true,
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['PORTADORES_CEP',       'CEPS_CEP'],
                                        ['PORTADORES_ENDERECO',  'CEPS_ENDERECO'],
                                        ['PORTADORES_BAIRRO',    'CEPS_BAIRRO'],
                                        ['CIDADES_NOME',         'CEPS_CIDADE'],
                                        ['PORTADORES_ID_CIDADES','CEPS_ID'],                                        
                                        ['CIDADES_ESTADO',       'CEPS_ESTADO'],
                                        ['CIDADES_IBGE',         'CEPS_IBGE']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',                                        
                                        value: '{model.PORTADORES_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'onSairCampoCep'
                                    }
                                },                                
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PORTADORES_ID_CIDADES}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CIDADES_IBGE}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Cidade',
                                    reference: 'cidade',
                                    proximoFoco: 'endereco',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'UF',
                                    reference: 'uf',
                                    proximoFoco: 'endereco',
                                    maxLength: 2,
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_ESTADO}'
                                    }
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
                                        value: '{model.PORTADORES_ENDERECO}',
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
                                        value: '{model.PORTADORES_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 9.5,
                                    fieldLabel: 'Bairro',
                                    reference: 'bairro',
                                    proximoFoco: 'banco',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PORTADORES_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Paramêtros',
                    items: [
                        {
                            items: [
                                {
                                    flex: 3.5,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    reference: 'empresa',
                                    proximoFoco: 'banco',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['EMPRESAS_FANTASIA',      'EMPRESAS_FANTASIA'],
                                        ['PORTADORES_ID_EMPRESAS', 'EMPRESAS_ID']
                                    ],
                                    bind: {
                                        value: '{model.EMPRESAS_FANTASIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PORTADORES_ID_EMPRESAS}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Banco',
                                    flex: 3.5,
                                    tabela: 'bancos',
                                    reference: 'banco',
                                    proximoFoco: 'agencia',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['BANCOS_NOME',          'BANCOS_NOME'],
                                        ['PORTADORES_ID_BANCOS', 'BANCOS_ID']
                                    ],
                                    bind: {
                                        value: '{model.BANCOS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.PORTADORES_ID_BANCOS}'
                                    }
                                }
                            ]
                        },                        
                        {
                            items: [
                                {
                                    flex: 2,
                                    fieldLabel: 'Agência',
                                    reference: 'agencia',
                                    proximoFoco: 'conta',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PORTADORES_AGENCIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 3.5,
                                    fieldLabel: 'Conta',
                                    reference: 'conta',
                                    proximoFoco: 'convenio',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PORTADORES_CONTA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 160,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Layout',
                                    reference: 'layout',
                                    proximoFoco: 'boleto',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'cnab400'],
                                        ['1', 'cnab240'],
                                        ['2', 'API Banco Brasil'],
                                        ['3', 'API Bradesco'],
                                        ['4', 'API Itaú'],
                                        ['5', 'API SICOOB'],
                                        ['6', 'API Santander'],
                                        ['7', 'API Caixa CEF']
                                    ],
                                    bind: {
                                        value: '{model.PORTADORES_LAYOUT}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 140,
                                    flex: false,
                                    xtype: 'combobox',
                                    fieldLabel: 'Emissão Boleto',
                                    reference: 'boleto',
                                    proximoFoco: 'convenio',
                                    forceSelection: true,
                                    editable: false,
                                    displayField: 'field2',
                                    store: [
                                        ['0', 'Cliente Emite'],
                                        ['1', 'Banco Emite']
                                    ],
                                    bind: {
                                        value: '{model.PORTADORES_BOLETO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2.0,
                                    fieldLabel: 'Convênio',
                                    reference: 'convenio',
                                    proximoFoco: 'carteira',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PORTADORES_CONVENIO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1.5,
                                    fieldLabel: 'Carteira',
                                    reference: 'carteira',
                                    proximoFoco: 'protesto',
                                    fieldStyle: 'text-align: right;',
                                    maxLength: 2,
                                    bind: {
                                        value: '{model.PORTADORES_CARTEIRA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1.5,
                                    fieldLabel: 'Protesto',
                                    reference: 'protesto',
                                    proximoFoco: 'devolucao',
                                    fieldStyle: 'text-align: right;',
                                    maxLength: 2,
                                    bind: {
                                        value: '{model.PORTADORES_PROTESTO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    fieldLabel: 'Devolução',
                                    reference: 'devolucao',
                                    proximoFoco: 'remessa',
                                    fieldStyle: 'text-align: right;',
                                    maxLength: 2,
                                    bind: {
                                        value: '{model.PORTADORES_DEVOLUCAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2.5,
                                    fieldLabel: 'Remessa',
                                    xtype: 'numberfield',
                                    reference: 'remessa',
                                    proximoFoco: 'mora',
                                    emptyText: '0',
                                    decimalPrecision: 0,
                                    minValue: 0,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    bind: {
                                        value: '{model.PORTADORES_REMESSA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    fieldLabel: '% Mora',
                                    xtype: 'samoswidgets-textmoney',
                                    reference: 'mora',
                                    proximoFoco: 'multa',
                                    bind: {
                                        value: '{model.PORTADORES_MORA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 2,
                                    fieldLabel: '% Multa',
                                    xtype: 'samoswidgets-textmoney',
                                    reference: 'multa',
                                    proximoFoco: 'nossonumero',
                                    bind: {
                                        value: '{model.PORTADORES_MULTA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'numberfield',
                                    flex: 2.5,
                                    reference: 'nossonumero',
                                    proximoFoco: 'save',
                                    fieldLabel: 'N. Número',
                                    decimalPrecision: 0,
                                    minValue: 0,
                                    hideTrigger: true,
                                    fieldStyle:'text-align:right',
                                    maxLength: 12,
                                    bind: {
                                        value: '{model.PORTADORES_NOSSONUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        { // Nova linha
                            items: [
                                {
                                    width: 150,
                                    fieldLabel: 'Cód Cedente',
                                    reference: 'cedente',
                                    proximoFoco: 'clientid',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PORTADORES_CEDENTE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Client ID',
                                    reference: 'clientid',
                                    proximoFoco: 'clientsecret',
                                    maxLength: 254,
                                    bind: {
                                        value: '{model.PORTADORES_CLIENTID}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Client SECRET',
                                    reference: 'clientsecret',
                                    proximoFoco: 'keyuser',
                                    maxLength: 254,
                                    bind: {
                                        value: '{model.PORTADORES_CLIENTSECRET}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Key User',
                                    reference: 'keyuser',
                                    proximoFoco: 'scope',
                                    maxLength: 128,
                                    bind: {
                                        value: '{model.PORTADORES_KEYUSER}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Scope',
                                    reference: 'scope',
                                    maxLength: 128,
                                    bind: {
                                        value: '{model.PORTADORES_SCOPE}',
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
