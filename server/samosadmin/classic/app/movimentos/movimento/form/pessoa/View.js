Ext.define('SamosAdmin.movimentos.movimento.form.pessoa.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formmovimentospessoa',

    requires: [
        'SamosAdmin.movimentos.movimento.form.pessoa.ViewModel',
        'SamosAdmin.movimentos.movimento.form.pessoa.ViewController'
    ],

    title: 'Pessoa',
    hidePaging: true,
    width: 850,
    height: 395,

    rightbuttons: [
        'Gravar',
        'Cancelar'
    ],

    constructor: function () {
        
        Ext.apply(this, {
            formgroups: [
                {
                    defaults: {
                        defaults: {
                            flex: false,
                            width: 132
                        }
                    },
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
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    width: 155,
                                    fieldLabel: 'CPF/CNPJ',
                                    reference: 'cpf',
                                    bind: {
                                        proximoFoco: '{(isPessoaFisica) ? "rg_tipo" : "inscricao_tipo"}',
                                        value: '{model.PESSOAS_CPFCNPJ}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: function () {
                                            if(this.getValue().trim() == '9999') {
                                                this.setValue('99999999000191');
                                            }
                                        },                                                                    
                                        keydown: 'verificarCPFCNPJExistente'
                                    }    
                                },
                                {
                                    xtype: 'textfield',
                                    width: 135,
                                    fieldLabel: 'RG',
                                    reference: 'rg_tipo',
                                    proximoFoco: 'nascimento',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.REGISTRO_GERAL}',
                                        hidden: '{!isPessoaFisica}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    xtype: 'textfield',
                                    width: 135,
                                    fieldLabel: 'Inscrição Estadual',
                                    reference: 'inscricao_tipo',
                                    proximoFoco: 'nascimento',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PESSOAS_INSCRICAO}',
                                        hidden: '{isPessoaFisica}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    width: 130,
                                    fieldLabel: 'Nascimento',
                                    reference: 'nascimento',
                                    proximoFoco: 'telefone',
                                    bind: {
                                        value: '{model.PESSOAS_NASCIMENTO}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'datefield'    
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
                                    'Telefone' : 'Telefone Fixo'),
                                    reference: 'telefone',
                                    proximoFoco: 'celular',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PESSOAS_TELEFONE}',
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
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '____-____',                                        
                                        '_____-____',
                                        '(__) ____-____',                                        
                                        '(__) _____-____'
                                    ],
                                        width: 130,
                                    fieldLabel: (configs.getClientName() == 'prudenmoveis' ? 
                                    'Recado' : 'Celular'),
                                    reference: 'celular',
                                    proximoFoco: 'nome',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PESSOAS_CELULAR}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: function () {
                                            if(this.getValue().slice(-3) == "_99") {
                                                this.setValue("99999999999");
                                            }
                                        }
                                    }
                                }                                
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textfield',
                                    flex: 2,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: 'nomeficticio_rg',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PESSOAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    maxLength: 50,
                                    xtype: 'textfield',                                        
                                    fieldLabel: 'Nome Fantasia',
                                    reference: 'nomeficticio_rg',
                                    proximoFoco: 'email',
                                    bind: {
                                        value: '{model.PESSOAS_FANTASIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Email',
                                    reference: 'email',
                                    proximoFoco: 'cep',                                    
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
                                                this.setValue("email@provedor.com.br");
                                            }
                                        }
                                    }
                                }
                            ]
                        },
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
                                        ['CIDADES_IBGE',      'CEPS_IBGE'],
                                        ['CIDADES_STATUS',    'CEPS_STATUS']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',                                        
                                        value: '{model.PESSOAS_CEP}',
                                        readOnly: '{readOnly}'
                                    }
                                },                                
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 50,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.PESSOAS_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 65,
                                    fieldLabel: 'N.º',
                                    reference: 'numero',
                                    proximoFoco: 'profissao_pagina',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.PESSOAS_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textfield',
                                    flex: 1.4,
                                    fieldLabel: configs.getPessoas().labelPagina,
                                    reference: 'profissao_pagina', 
                                    proximoFoco: 'bairro',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PESSOAS_PAGINA}',
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
                                    fieldLabel: 'Bairro',
                                    maxLength: 50,
                                    reference: 'bairro',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.PESSOAS_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Cidade',
                                    tabela: 'cidades',
                                    reference: 'cidade',
                                    readOnly: true,
                                    ui: 'field-readonly',                                
                                    bind: {
                                        value: '{model.CIDADES_NOME}'
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
                                    }
                                },
                                {
                                    hidden: true,
                                    reference: 'idcidades',
                                    bind: {
                                        value: '{model.PESSOAS_ID_CIDADES}'
                                    },
                                },
                                {
                                    hidden: true,
                                    reference: 'ibge',
                                    bind: {
                                        value: '{model.CIDADES_IBGE}'
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
                        }
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
