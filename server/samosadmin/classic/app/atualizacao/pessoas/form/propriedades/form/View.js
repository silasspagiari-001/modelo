Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formpropriedades',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.propriedades.form.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.propriedades.form.ViewController'
    ],

    title: 'Propriedade',
    hidePaging: true,
    width: 850,
    height: 380,

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
                                    flex: false,
                                    width: 110,
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.PROPRIEDADES_STATUS}',
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
                                    width: 180,
                                    fieldLabel: 'CPF/CNPJ',
                                    reference: 'cpf',
                                    proximoFoco: 'inscricao_tipo',
                                    bind: {
                                        value: '{model.PROPRIEDADES_CPFCNPJ}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: function () {
                                            if(this.getValue().trim() == '9999') {
                                                this.setValue('99999999000191');
                                            }
                                        }                                                                   
//                                      keydown: 'verificarCPFCNPJExistente'
                                    }    
                                },
                                {
                                    xtype: 'textfield',
                                    width: 145,
                                    fieldLabel: 'Inscrição Estadual',
                                    reference: 'inscricao_tipo',
                                    proximoFoco: 'telefone',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PROPRIEDADES_INSCRICAO}',
                                        readOnly: '{readOnly}'
                                    }    
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Cadastro',
                                    reference: 'cadastro',
                                    proximoFoco: 'telefone',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PROPRIEDADES_CADASTRO}',
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
                                    fieldLabel: 'Telefone Fixo',
                                    reference: 'telefone',
                                    proximoFoco: 'nome',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PROPRIEDADES_TELEFONE}',
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
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textfield',
                                    flex: 2,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: 'celular',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PROPRIEDADES_NOME}',
                                        readOnly: '{readOnly}'
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
                                    fieldLabel: 'Celular',
                                    reference: 'celular',
                                    proximoFoco: 'cep',
                                    maxLength: 15,
                                    bind: {
                                        value: '{model.PROPRIEDADES_CELULAR}',
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
                                    xtype: 'samoswidgets-textsearch',
                                    width: 130,
                                    fieldLabel: 'CEP',
                                    reference: 'cep',
                                    naoFocarAposPesquisar: true,
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['PROPRIEDADES_CEP',          'CEPS_CEP'],
                                        ['PROPRIEDADES_ENDERECO',     'CEPS_ENDERECO'],
                                        ['PROPRIEDADES_BAIRRO',       'CEPS_BAIRRO'],
                                        ['CIDADES_NOMEPROPRIEDADE',   'CEPS_CIDADE'],
                                        ['PROPRIEDADES_ID_CIDADES',   'CEPS_ID'],                                        
                                        ['CIDADES_ESTADOPROPRIEDADE', 'CEPS_ESTADO'],
                                        ['CIDADES_IBGEPROPRIEDADE',   'CEPS_IBGE']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',
                                        value: '{model.PROPRIEDADES_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: 'setarCep'
                                    }
                                },                                
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 50,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.PROPRIEDADES_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 65,
                                    fieldLabel: 'N.º',
                                    reference: 'numero',
                                    proximoFoco: 'bairro',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.PROPRIEDADES_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Bairro',
                                    maxLength: 50,
                                    reference: 'bairro',
                                    proximoFoco: 'observacoes',
                                    bind: {
                                        value: '{model.PROPRIEDADES_BAIRRO}',
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
                                        value: '{model.CIDADES_NOMEPROPRIEDADE}'
                                    }
                                },
                                {
                                    width: 60,
                                    fieldLabel: 'UF',
                                    reference: 'uf',
                                    maxLength: 2,
                                    proximoFoco: 'observacoes',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.CIDADES_ESTADOPROPRIEDADE}'
                                    }
                                },
                                {
                                    hidden: true,
                                    reference: 'idcidades',
                                    bind: {
                                        value: '{model.PROPRIEDADES_ID_CIDADES}'
                                    },
                                },
                                {
                                    hidden: true,
                                    reference: 'ibge',
                                    bind: {
                                        value: '{model.CIDADES_IBGEPROPRIEDADE}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textfield',
                                    flex: 2,
                                    fieldLabel: 'Observações',
                                    reference: 'observacoes',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PROPRIEDADES_OBSERVACOES}',
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
