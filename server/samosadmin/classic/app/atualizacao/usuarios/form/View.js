Ext.define('SamosAdmin.atualizacao.usuarios.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formusuarios',

    title: 'Usuário',

    requires: [
        'SamosAdmin.atualizacao.usuarios.form.ViewModel',
        'SamosAdmin.atualizacao.usuarios.form.ViewController',
        'SamosAdmin.atualizacao.empresas.search.View'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Permissões',
        'Opções: Enviar senha por email, Atribuir senha padrão'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],
    constructor: function () {
        let primeiroBloco;

        if(configs.getUsuarios().foto) {
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
                                        ui: 'field-readonly',
                                        fieldStyle: 'text-align:right;',
                                        readOnly: true,
                                        bind: {
                                            value: '{modelId}'
                                        }
                                    },
                                    {
                                        width: 160,
                                        xtype: 'combobox',
                                        editable: false,                                            
                                        fieldLabel: 'Status',
                                        reference: 'status',
                                        forceSelection: true,
                                        proximoFoco: 'nome',
                                        store: [
                                            ['I', 'Interno'],
                                            ['E', 'Externo'],
                                            ['T', 'Interno/Externo'],
                                            ['F', 'Inativo'],
                                            ['P', 'Pendente']
                                        ],
                                        bind: {
                                            value: '{model.USUARIOS_STATUS}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        flex: 1,
                                        maxLength: 50,
                                        fieldLabel: 'Nome',
                                        reference: 'nome',
                                        proximoFoco: 'login',
                                        bind: {
                                            value: '{model.USUARIOS_NOME}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        xtype: (
                                            configs.getLogin().case == 'uppercase' ? 'samoswidgets-textupper' : 
                                            configs.getLogin().case == 'lowercase' ? 'samoswidgets-textlower' : 
                                            'textfield'
                                        ),
                                        width: 190,
                                        maxLength: 50,
                                        fieldLabel: 'Login de Acesso',
                                        reference: 'login',
                                        proximoFoco: 'senha',
                                        bind: {
                                            value: '{model.USUARIOS_LOGIN}',
                                            readOnly: '{readOnly}'
                                        },
                                        listeners: {
                                            keydown: 'verificarLoginDisponivel'
                                        }
                                    },
                                    {
                                        xtype: 'datefield',
                                        width: 135,
                                        fieldLabel: configs.getClientName() == 'prudenmoveis' ? 'Admissão'  : 'Cadastro',
                                        bind: {
                                            value: '{model.USUARIOS_CADASTRO}',
                                            readOnly: '{readOnly || !isPrudenMoveis}'
                                        }
                                    }
                                ]
                            },
                            {
                                items: [
                                    {
                                        xtype: 'samoswidgets-maskfield',
                                        textMask: [
                                            '___.___.___-__',
                                            '__.___.___/____-__'
                                        ],
                                        width: 240,
                                        fieldLabel: 'CPF/CNPJ',
                                        reference: 'cpfcnpj',
                                        proximoFoco: 'rg',
                                        maxLength: 20,
                                        bind: {
                                            value: '{model.USUARIOS_CPFCNPJ}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        flex: 1,
                                        fieldLabel: 'RG',
                                        reference: 'rg',
                                        proximoFoco: 'tipo',
                                        maxLength: 15,
                                        bind: {
                                            value: '{model.USUARIOS_RG}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        flex: 1,
                                        xtype: 'combobox',
                                        fieldLabel: 'Tipo',
                                        reference: 'tipo',
                                        proximoFoco: 'celular',
                                        forceSelection: true,
                                        editable: false,
                                        bind: {
                                            value: '{model.USUARIOS_TIPO}',
                                            readOnly: '{readOnly}',
                                            store: configs.getUsuarios().tipos,                                            
                                        }
                                    },
                                    {
                                        xtype: 'samoswidgets-maskfield',
                                        textMask: '(__) _____-____',
                                        width: 130,
                                        fieldLabel: 'Celular',
                                        reference: 'celular',
                                        proximoFoco: 'validade',
                                        maxLength: 15,
                                        bind: {
                                            value: '{model.USUARIOS_CELULAR}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        xtype: 'samoswidgets-maskfield',
                                        textMask: '(__) ____-____',
                                        width: 125,
                                        fieldLabel: 'Fone adicional',
                                        reference: 'telefone',
                                        proximoFoco: 'celular',
                                        maxLength: 15,
                                        bind: {
                                            value: '{model.USUARIOS_TELEFONE}',
                                            readOnly: '{readOnly}'
                                        }
                                    },
                                    {
                                        xtype: 'datefield',
                                        width: 135,
                                        fieldLabel: 'Nascimento',
                                        reference: 'nascimento',
                                        proximoFoco: 'expediente',
                                        bind: {
                                            value: '{model.USUARIOS_NASCIMENTO}',
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
                                bind: {
                                    value: '{modelId}'
                                },
                                ui: 'field-readonly',
                                fieldStyle: 'text-align:right;',
                                readOnly: true
                            },
                            {
                                width: 160,
                                xtype: 'combobox',
                                editable: false,                                            
                                fieldLabel: 'Status',
                                reference: 'status',
                                forceSelection: true,
                                proximoFoco: 'nome',
                                store: [
                                    ['I', 'Interno'],
                                    ['E', 'Externo'],
                                    ['T', 'Interno/Externo'],
                                    ['F', 'Inativo'],
                                    ['P', 'Pendente']
                                ],
                                bind: {
                                    value: '{model.USUARIOS_STATUS}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                flex: 1,
                                maxLength: 50,
                                fieldLabel: 'Nome',
                                reference: 'nome',
                                proximoFoco: 'login',
                                bind: {
                                    value: '{model.USUARIOS_NOME}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: (
                                    configs.getLogin().case == 'uppercase' ? 'samoswidgets-textupper' : 
                                    configs.getLogin().case == 'lowercase' ? 'samoswidgets-textlower' : 
                                    'textfield'
                                ),
                                width: 190,
                                maxLength: 50,
                                fieldLabel: 'Login de Acesso',
                                reference: 'login',
                                proximoFoco: 'cpfcnpj',
                                bind: {
                                    value: '{model.USUARIOS_LOGIN}',
                                    readOnly: '{readOnly}'
                                },
                                listeners: {
                                    keydown: 'verificarLoginDisponivel'
                                }
                            },
                            {
                                xtype: 'datefield',
                                width: 135,
                                fieldLabel: configs.getClientName() == 'prudenmoveis' ? 'Admissão'  : 'Cadastro',
                                bind: {
                                    value: '{model.USUARIOS_CADASTRO}',
                                    readOnly: '{readOnly || !isPrudenMoveis}'
                                }
                            }
                        ]
                    },
                    {
                        items: [
                            {
                                xtype: 'samoswidgets-maskfield',
                                textMask: [
                                    '___.___.___-__',
                                    '__.___.___/____-__'
                                ],
                                width: 240,
                                fieldLabel: 'CPF/CNPJ',
                                reference: 'cpfcnpj',
                                proximoFoco: 'rg',
                                maxLength: 20,
                                bind: {
                                    value: '{model.USUARIOS_CPFCNPJ}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                flex: 1,
                                fieldLabel: 'RG',
                                reference: 'rg',
                                proximoFoco: 'tipo',
                                maxLength: 15,
                                bind: {
                                    value: '{model.USUARIOS_RG}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                flex: 1,
                                xtype: 'combobox',
                                fieldLabel: 'Tipo',
                                reference: 'tipo',
                                proximoFoco: 'celular',
                                forceSelection: true,
                                editable: false,
                                bind: {
                                    value: '{model.USUARIOS_TIPO}',
                                    readOnly: '{readOnly}',
                                    store: configs.getUsuarios().tipos
                                }
                            },
                            {
                                xtype: 'samoswidgets-maskfield',
                                textMask: '(__) _____-____',
                                width: 130,
                                fieldLabel: 'Celular',
                                reference: 'celular',
                                proximoFoco: 'nascimento',
                                maxLength: 15,
                                bind: {
                                    value: '{model.USUARIOS_CELULAR}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'samoswidgets-maskfield',
                                textMask: '(__) ____-____',
                                width: 125,
                                fieldLabel: 'Fone adicional',
                                reference: 'telefone',
                                proximoFoco: 'nascimento',
                                maxLength: 15,
                                bind: {
                                    value: '{model.USUARIOS_TELEFONE}',
                                    readOnly: '{readOnly}'
                                }
                            },
                            {
                                xtype: 'datefield',
                                width: 135,
                                fieldLabel: 'Nascimento',
                                reference: 'nascimento',
                                proximoFoco: 'cep',
                                bind: {
                                    value: '{model.USUARIOS_NASCIMENTO}',
                                    readOnly: '{readOnly}'
                                }
                            }
                        ]
                    }
                ]
            };
        }

        Ext.apply(this, {
            formgroups: [
                primeiroBloco,                
                {
                    title: 'Localização',
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    width: 110,
                                    fieldLabel: 'CEP',
                                    reference: 'cep',
                                    naoFocarAposPesquisar: true,
                                    maxLength: 9,
                                    tabela: 'ceps',
                                    buscarPor: 'CEP',
                                    associations: [
                                        ['USUARIOS_CEP',       'CEPS_CEP'],
                                        ['USUARIOS_ENDERECO',  'CEPS_ENDERECO'],
                                        ['USUARIOS_BAIRRO',    'CEPS_BAIRRO'],
                                        ['CIDADES_NOME',       'CEPS_CIDADE'],
                                        ['USUARIOS_ID_CIDADES','CEPS_ID'],                                        
                                        ['CIDADES_ESTADO',     'CEPS_ESTADO'],
                                        ['CIDADES_IBGE',       'CEPS_IBGE']
                                    ],
                                    bind: {
                                        proximoFoco: '{isCepUnico ? "endereco" : "numero"}',                                        
                                        value: '{model.USUARIOS_CEP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        blur: 'onSairCampoCep'
                                    }
                                },                                
                                {
                                    hidden: true,
                                    bind: {
                                        value: '{model.USUARIOS_ID_CIDADES}'
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
                                    flex: 1,
                                    fieldLabel: 'Endereço',
                                    maxLength: 50,
                                    reference: 'endereco',
                                    proximoFoco: 'numero',
                                    bind: {
                                        value: '{model.USUARIOS_ENDERECO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 120,
                                    fieldLabel: 'Número',
                                    reference: 'numero',
                                    proximoFoco: 'bairro',
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.USUARIOS_NUMERO}',
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
                                    reference: 'bairro',
                                    proximoFoco: 'email',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.USUARIOS_BAIRRO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textlower',
                                    flex: 1,
                                    fieldLabel: 'Email',
                                    reference: 'email',
                                    proximoFoco: 'comissao',
                                    maxLength: 70,
                                    bind: {
                                        value: '{model.USUARIOS_EMAIL}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        change: function (txt, nv) {
                                            if (nv && nv.toLowerCase) txt.setValue(nv.toLowerCase())
                                        }
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
                                    xtype: 'samoswidgets-textmoney',
                                    width: 60,
                                    fieldLabel: 'Comissão',
                                    reference: 'comissao',
                                    maxValue: 100.00,
                                    proximoFoco: 'privilegiado',
                                    bind: {
                                        value: '{model.USUARIOS_COMISSAO}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 120,
                                    xtype: 'combobox',
                                    fieldLabel: 'Privilegiado',
                                    reference: 'privilegiado',
                                    proximoFoco: 'empresa',
                                    emptyText: '',
                                    forceSelection: true,
                                    bind: {
                                        value: '{model.USUARIOS_PRIVILEGIADO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['0', 'Sim'],
                                            ['1', 'Não']
                                        ]
                                    }
                                },
                                {
                                    width: 60,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tempo',
                                    reference: 'tempo',
                                    proximoFoco: 'empresa',
                                    forceSelection: true,
                                    bind: {
                                        value: '{model.USUARIOS_TEMPO}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            '5',
                                            '10',
                                            '15',
                                            '20',
                                            '25',
                                            '30',
                                            '35',
                                            '40',
                                            '45',
                                            '50',
                                            '55',
                                            '60',
                                            '99'
                                        ]
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Empresa',
                                    tabela: 'empresas',
                                    reference: 'empresa',
                                    proximoFoco: 'validade',
                                    buscarPor: 'Genérica',
                                    naoFocarAposPesquisar: true, 
                                    associations: [
                                        ['EMPRESAS_FANTASIA',    'EMPRESAS_FANTASIA'],
                                        ['USUARIOS_ID_EMPRESAS', 'EMPRESAS_ID'],
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}',                                        
                                        value: '{model.EMPRESAS_FANTASIA}'
                                    }
                                },                                
                                {
                                    xtype: 'datefield',
                                    width: 120,
                                    fieldLabel: 'Validade',
                                    reference: 'validade',
                                    proximoFoco: 'cep',
                                    bind: {
                                        value: '{model.USUARIOS_VALIDADE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    width: 120,
                                    fieldLabel: 'Ultimo login',
                                    reference: 'ultimologin',
                                    proximoFoco: 'save',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.USUARIOS_ULTIMOLOG}',
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
                                    editable: false,                                            
                                    fieldLabel: 'Expediente',
                                    reference: 'expedienteinicial',
                                    forceSelection: true,
                                    proximoFoco: 'nome',
                                    store: (() => {
                                        const s = moment().hour(23).minute(55);
                                        return new Array(24 * 12).fill(0).map(() => {
                                            return s.add(5, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.EXPEDIENTEINICIAL_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    editable: false,                                            
                                    fieldLabel: 'Até',
                                    reference: 'expedientefinal',
                                    forceSelection: true,
                                    proximoFoco: 'nome',
                                    store: (() => {
                                        const s = moment().hour(23).minute(55);
                                        return new Array(24 * 12).fill(0).map(() => {
                                            return s.add(5, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.EXPEDIENTEFINAL_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    editable: false,                                            
                                    fieldLabel: 'Intervalo',
                                    reference: 'intervaloinicial',
                                    forceSelection: true,
                                    proximoFoco: 'nome',
                                    store: (() => {
                                        const s = moment().hour(23).minute(55);
                                        return new Array(24 * 12).fill(0).map(() => {
                                            return s.add(5, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.INTERVALOINICIAL_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    editable: false,                                            
                                    fieldLabel: 'Até',
                                    reference: 'intervalofinal',
                                    forceSelection: true,
                                    proximoFoco: 'nome',
                                    store: (() => {
                                        const s = moment().hour(23).minute(55);
                                        return new Array(24 * 12).fill(0).map(() => {
                                            return s.add(5, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.INTERVALOFINAL_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 118,
                                    xtype: 'combobox',
                                    editable: false,                                            
                                    fieldLabel: 'Intervalo Sáb',
                                    reference: 'intervalosabinicial',
                                    forceSelection: true,
                                    proximoFoco: 'nome',
                                    store: (() => {
                                        const s = moment().hour(23).minute(55);
                                        return new Array(24 * 12).fill(0).map(() => {
                                            return s.add(5, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.INTERVALOSABINICIAL_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 118,
                                    xtype: 'combobox',
                                    editable: false,                                            
                                    fieldLabel: 'Até',
                                    reference: 'intervalosabfinal',
                                    forceSelection: true,
                                    proximoFoco: 'nome',
                                    store: (() => {
                                        const s = moment().hour(23).minute(55);
                                        return new Array(24 * 12).fill(0).map(() => {
                                            return s.add(5, 'minutes').format('HH:mm')
                                        })
                                    })(),
                                    bind: {
                                        value: '{model.INTERVALOSABFINAL_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 67,
                                    fieldLabel: 'Dias Ativo',
                                    reference: 'diasativodom',
                                    bind: {
                                        value: '{model.DIASATIVODOM_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Dom',
                                    checked: false
                                },
                                {
                                    width: 60,
                                    reference: 'diasativoseg',
                                    bind: {
                                        value: '{model.DIASATIVOSEG_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    margin: '16 0 0 0',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Seg',
                                    checked: true
                                },
                                {
                                    width: 60,
                                    reference: 'diasativoter',
                                    bind: {
                                        value: '{model.DIASATIVOTER_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    margin: '16 0 0 0',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ter',
                                    checked: true
                                },
                                {
                                    width: 60,
                                    reference: 'diasativoqua',
                                    bind: {
                                        value: '{model.DIASATIVOQUA_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    margin: '16 0 0 0',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Qua',
                                    checked: true
                                },
                                {
                                    width: 60,
                                    reference: 'diasativoqui',
                                    bind: {
                                        value: '{model.DIASATIVOQUI_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    margin: '16 0 0 0',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Qui',
                                    checked: true
                                },
                                {
                                    width: 60,
                                    reference: 'diasativosex',
                                    bind: {
                                        value: '{model.DIASATIVOSEX_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    margin: '16 0 0 0',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Sex',
                                    checked: true
                                },
                                {
                                    width: 60,
                                    reference: 'diasativosab',
                                    bind: {
                                        value: '{model.DIASATIVOSAB_USUARIOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    margin: '16 0 0 0',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Sab',
                                    checked: true
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
