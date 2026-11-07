Ext.define('SamosAdmin.relatorios.financeiro.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosfinanceirolist',

    requires: [
        'SamosAdmin.relatorios.financeiro.list.ViewController',
        'SamosAdmin.relatorios.financeiro.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function (cfg) {

        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    width: 100,
                                    fieldLabel: 'Relatório',
                                    reference: 'quebra',
                                    bind: {
                                        value: '{valueQuebra}',
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Quebra',
                                    checked: true
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Títulos',
                                    reference: 'semnn',
                                    bind: {
                                        value: '{valueSemnn}',
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Sem Nosso Número',
                                    checked: false
                                },
                                {
                                    flex: 1,
                                    hidden: configs.getClientName() != 'racaforte',
                                    fieldLabel: 'Finalidade',
                                    reference: 'relirf',
                                    bind: {
                                        value: '{valueRelirf}',
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Relatorio IR',
                                    listeners: {
                                       change: 'onRelatorioIRChange'
                                    },
                                    checked: false
                                }                                
                            ]
                        },                        
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: configs.getClientName() == 'prudenmoveis' ? 
                                    [
                                        ['0', 'Contas a Receber'],
                                        ['1', 'Contas a Pagar'],
                                        ['2', 'Permutas']
                                    ] : 
                                    [
                                        ['0', 'Contas a Receber'],
                                        ['1', 'Contas a Pagar']
                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Documento',
                                    reference: 'documento',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Todos'],
                                        [3, 'Notas Eletrônicas'],
                                        [2, 'Pedidos'],
                                        [4, 'Requisições']
                                    ],
                                    bind: {
                                        value: '{valueDocumento}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Ordem',
                                    reference: 'ordem',
                                    proximoFoco: 'buscar',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: configs.getClientName() == 'racaforte' ? 
                                    [
                                        [0, 'Vencimento'],
                                        [1, 'Pagamento'],
                                        [2, 'Emissão/Recepçao'],
                                        [3, 'Pessoa'],
                                        [4, 'Número'],
                                        [5, 'Portador'],
                                        [6, 'Aplicação'],
                                        [7, 'Centro de custo'],
                                        [8, 'Valor Original']
                                    ] : 
                                    [
                                        [0, 'Vencimento'],
                                        [1, 'Pagamento'],
                                        [2, 'Emissão'],
                                        [3, 'Pessoa'],
                                        [4, 'Número'],
                                        [5, 'Portador'],
                                        [6, 'Aplicação'],
                                        [7, 'Centro de custo'],
                                        [8, 'Valor Original']
                                    ],
                                  bind: {
                                        value: '{valueOrdem}'
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    proximoFoco: 'buscar',
                                    forceSelection: false,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    store: [
                                        [0, 'Abertos'],
                                        [1, 'Pagos'],
                                        [2, 'Todos']                
                                    ],
                                    bind: {
                                        value: '{valueStatus}'
                                    }
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão de',
                                    reference: 'emiinicio',
                                    flex: 1,
                                    bind: {
                                        value: '{valueEmiinicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão até',
                                    reference: 'emifinal',                                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueEmifinal}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Vencimento de',
                                    reference: 'vctinicio',                                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueVctinicio}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Vencimento até',
                                    reference: 'vctfinal',
                                    flex: 1,
                                    bind: {
                                        value: '{valueVctfinal}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Data-Base',
                                    reference: 'database',                                    
                                    flex: 1,
                                    bind: {
                                        value: '{valueDatabase}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Pagamento de',
                                    reference: 'pgtinicio',                                    
                                    blankText: 'Informe o Pagamento Inicial',
                                    allowBlank : false,
                                    flex: 1,
                                    bind: {
                                        value: '{valuePgtinicio}'
                                    }

                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Pagamento até',
                                    reference: 'pgtfinal',
                                    allowBlank : false,
                                    flex: 1,
                                    bind: {
                                        value: '{valuePgtfinal}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Valor Original de',
                                    flex: 1,
                                    reference: 'vloinicio',
                                    bind: {
                                        value: '{valueVloinicio}'
                                    }

                                },
                                {
                                    xtype: 'samoswidgets-textmoney',
                                    fieldLabel: 'Valor Original até',
                                    flex: 1,
                                    reference: 'vlofinal',
                                    bind: {
                                        value: '{valueVlofinal}'
                                    }

                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codpessoai',
                                    itemId: 'idpessoai',
                                    bind: {
                                        fieldLabel: '{valueTipo == 2 ? "Código A" : "Código"}',
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    tabela: 'pessoas',
                                    reference: 'pessoai',
                                    proximoFoco: 'pessoaf',
                                    buscarPor: 'Genérica',
                                    complement: 'idpessoai',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {                                        
                                        fieldLabel: '{valueTipo == 2 ? "Pessoa A" : "Pessoa Inicial"}',
                                    }
                                },
                                {
                                    width: 100,
                                    fieldStyle: 'text-align:right;',  
                                    reference: 'codpessoaf',                                  
                                    readOnly: true,
                                    itemId: 'idpessoaf',
                                    hidden: ['racaforte', 'malacrida'].includes(configs.getClientName()),
                                    bind: {
                                        fieldLabel: '{valueTipo == 2 ? "Código B" : "Código"}',
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    hidden: ['racaforte', 'malacrida'].includes(configs.getClientName()),
                                    tabela: 'pessoas',
                                    reference: 'pessoaf',
                                    proximoFoco: 'portadori',
                                    buscarPor: 'Genérica',
                                    complement: 'idpessoaf',
                                    associations: [
                                        ['PESSOAS_NOME', 'PESSOAS_NOME'],
                                        ['PESSOAS_ID',   'PESSOAS_ID']
                                    ],
                                    bind: {                                        
                                        fieldLabel: '{valueTipo == 2 ? "Pessoa B" : "Pessoa Final"}',
                                    }                                        
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codportadori',
                                    itemId: 'idportadori'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Portador Inicial',
                                    tabela: 'portadores',
                                    reference: 'portadori',
                                    proximoFoco: 'portadorf',
                                    buscarPor: 'Genérica',
                                    complement: 'idportadori',
                                    associations: [
                                        ['PORTADORES_NOME', 'PORTADORES_NOME'],
                                        ['PORTADORES_ID',   'PORTADORES_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codportadorf',
                                    itemId: 'idportadorf'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Portador Final',
                                    tabela: 'portadores',
                                    reference: 'portadorf',
                                    proximoFoco: 'aplicacaoi',
                                    buscarPor: 'Genérica',
                                    complement: 'idportadorf',
                                    associations: [
                                        ['PORTADORES_NOME', 'PORTADORES_NOME'],
                                        ['PORTADORES_ID',   'PORTADORES_ID']
                                    ]                        
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codaplicacaoi',
                                    itemId: 'idaplicacaoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Aplicação Inicial',
                                    tabela: 'aplicacoes',
                                    reference: 'aplicacaoi',
                                    proximoFoco: 'aplicacaof',
                                    buscarPor: 'Genérica',
                                    complement: 'idaplicacaoi',
                                    associations: [
                                        ['APLICACOES_NOME', 'APLICACOES_NOME'],
                                        ['APLICACOES_ID',   'APLICACOES_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codaplicacaof',
                                    itemId: 'idaplicacaof'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Aplicação Final',
                                    tabela: 'aplicacoes',
                                    reference: 'aplicacaof',
                                    proximoFoco: 'custoi',
                                    buscarPor: 'Genérica',
                                    complement: 'idaplicacaof',
                                    associations: [
                                        ['APLICACOES_NOME', 'APLICACOES_NOME'],
                                        ['APLICACOES_ID',   'APLICACOES_ID']
                                    ]                        
                                },
                                {   // Profissional, apenas na Lislais */*/*/*/
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    hidden: !['lislais', 'malacrida'].includes(configs.getClientName()),
                                    fieldLabel: ['malacrida'].includes(configs.getClientName()) ? "Vendedor" : "Profissional",
                                    tabela: 'usuarios',
                                    reference: 'profissional',
                                    proximoFoco: 'custoi',
                                    buscarPor: 'Genérica',
                                    complement: 'idprofissional',
                                    associations: [
                                        ['USUARIOS_NOME', 'USUARIOS_NOME'],
                                        ['USUARIOS_ID',   'USUARIOS_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    hidden: true,
                                    reference: 'codprofissional',
                                    itemId: 'idprofissional'
                                },
                            ]
                        },
                        {
                            items: [
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codcustoi',
                                    itemId: 'idcustoi'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Centro Custo Inicial',
                                    tabela: 'custos',
                                    reference: 'custoi',
                                    proximoFoco: 'custof',
                                    buscarPor: 'Genérica',
                                    complement: 'idcustoi',
                                    associations: [
                                        ['CUSTOS_NOME', 'CUSTOS_NOME'],
                                        ['CUSTOS_ID',   'CUSTOS_ID']
                                    ]                        
                                },
                                {
                                    fieldLabel: 'Código',
                                    width: 100,
                                    fieldStyle: 'text-align:right;',                                    
                                    readOnly: true,
                                    reference: 'codcustof',
                                    itemId: 'idcustof'
                                },
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Centro de Custo Final',
                                    tabela: 'custos',
                                    reference: 'custof',
                                    buscarPor: 'Genérica',
                                    complement: 'idcustof',
                                    associations: [
                                        ['CUSTOS_NOME', 'CUSTOS_NOME'],
                                        ['CUSTOS_ID',   'CUSTOS_ID']
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
