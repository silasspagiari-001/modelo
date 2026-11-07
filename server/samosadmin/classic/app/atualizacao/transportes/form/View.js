Ext.define('SamosAdmin.atualizacao.transportes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formtransportes',

    title: 'Transportes',

    requires: [
        'SamosAdmin.atualizacao.transportes.form.ViewModel',
        'SamosAdmin.atualizacao.transportes.form.ViewController'
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
        const tema = configs.getTema();

        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Dados Básicos',
                    xtype: 'samoswidgets-defaultform',
                    ui: 'formpanel-clean-' + tema,
                    padding: '10 5 10 20',
                    flex: 1,
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'textfield',
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
                                    proximoFoco: 'tipo',
                                    bind: {
                                        value: '{model.TRANSPORTES_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: 'cpfcnpj',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.TRANSPORTES_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: [
                                        '___.___.___-__',
                                        '__.___.___/____-__'
                                    ],
                                    width: 145,
                                    flex: false,
                                    reference: 'cpfcnpj',
                                    proximoFoco: 'inscricao',
                                    fieldLabel: 'CPF/CNPJ',
                                    bind: {
                                        value: '{model.TRANSPORTES_CPFCNPJ}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 130,
                                    fieldLabel: 'Inscrição',
                                    reference: 'inscricao',
                                    proximoFoco: 'cep',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.TRANSPORTES_INSCRICAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 105,
                                    flex: false,
                                    reference: 'cadastro',
                                    fieldLabel: 'Cadastro',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.TRANSPORTES_CADASTRO}',
                                    },
                                    xtype: 'datefield'
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
                                        ['TRANSPORTES_CEP',       'CEPS_CEP'],
                                        ['TRANSPORTES_ENDERECO',  'CEPS_ENDERECO'],
                                        ['TRANSPORTES_BAIRRO',    'CEPS_BAIRRO'],
                                        ['CIDADES_NOME',          'CEPS_CIDADE'],
                                        ['TRANSPORTES_ID_CIDADES','CEPS_ID'],                                        
                                        ['CIDADES_ESTADO',        'CEPS_ESTADO'],
                                        ['CIDADES_IBGE',          'CEPS_IBGE']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',                                        
                                        value: '{model.TRANSPORTES_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'onSairCampoCep'
                                    }
                                },                                
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.TRANSPORTES_ID_CIDADES}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.CIDADES_IBGE}'
                                    }
                                },
                                {
                                    flex: 9,
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
                                    flex: 1,
                                    fieldLabel: 'UF',
                                    bind: '{model.CIDADES_ESTADO}',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    reference: 'estado'
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 40,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.TRANSPORTES_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 120,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'bairro',
                                    maxLength: 5,
                                    bind: {
                                        value: '{model.TRANSPORTES_NUMERO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 297,
                                    fieldLabel: 'Bairro',
                                    reference: 'bairro',
                                    proximoFoco: 'telefone',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.TRANSPORTES_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    hidden: true,
                                    bind: '{model.CIDADES_IBGE}',
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) ____-____',
                                    flex: false,
                                    width: 130,
                                    fieldLabel: 'Telefone Fixo',
                                    reference: 'telefone',
                                    proximoFoco: 'celular',
                                    bind: {
                                        value: '{model.TRANSPORTES_TELEFONE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-maskfield',
                                    textMask: '(__) _____-____',
                                    flex: false,
                                    width: 130,
                                    fieldLabel: 'Celular',
                                    reference: 'celular',
                                    proximoFoco: 'email',
                                    bind: {
                                        value: '{model.TRANSPORTES_CELULAR}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textlower',
                                    flex: 1,
                                    fieldLabel: 'Email',
                                    reference: 'email',
                                    proximoFoco: 'pagina',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.TRANSPORTES_EMAIL}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    flex: 1,
                                    fieldLabel: 'Página',
                                    reference: 'pagina',
                                    proximoFoco: 'via',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.TRANSPORTES_PAGINA}',
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
                                    width: 145,
                                    xtype: 'combobox',
                                    fieldLabel: 'Via',
                                    reference: 'via',
                                    proximoFoco: 'modo',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    store: [
                                        ['R', 'Rodoviário'],
                                        ['F', 'Ferroviário'],
                                        ['U', 'Fluvial'],
                                        ['A', 'Aéreo']
                                    ],
                                    bind: {
                                        value: '{model.TRANSPORTES_VIA}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 145,
                                    xtype: 'combobox',
                                    fieldLabel: 'Modo',
                                    reference: 'modo',
                                    proximoFoco: 'save',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.TRANSPORTES_MODO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['F', 'Destinatário'],  // Fob
                                            ['C', 'Emitente'],      // Cif
                                            ['T', 'Terceiros'],     
                                            ['S', 'Sem Frete'],     
                                            ['D', 'Sem Frete/Dados']                                            
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
