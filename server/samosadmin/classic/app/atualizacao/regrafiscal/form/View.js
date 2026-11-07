Ext.define('SamosAdmin.atualizacao.regrafiscal.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formregrafiscal',

    title: 'Regra Fiscal',

    requires: [
        'SamosAdmin.atualizacao.regrafiscal.form.ViewModel'
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
                    items: [
                        {
                            items: [
                                {
                                    flex: false,
                                    width: 70, //100
                                    fieldLabel: 'Código',
                                    reference: 'codigo',
                                    proximoFoco: 'nome',
                                    emptyText: '000000',
                                    fieldStyle: 'text-align: right;',
                                    maxLength: 6,
                                    minLength: 6,
                                    msgTarget: 'none',
                                    bind: {
                                        value: '{model.REGRAFISCAL_ID}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'checarSeExiste'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 70,  // 90
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    bind: {
                                        value: '{model.REGRAFISCAL_STATUS}',
                                        readOnly: '{readOnly}'
                                    },
                                    xtype: 'checkbox',
                                    inputValue: 'T',
                                    uncheckedValue: 'F',
                                    boxLabel: 'Ativo',
                                    checked: true
                                },
                                {
                                    flex: 0.8,
                                    maxLength: 100,
                                    reference: 'nome',
                                    proximoFoco: 'aplicacao',
                                    enableKeyEvents: true,
                                    fieldLabel: 'Nome',
                                    bind: {
                                        value: '{model.REGRAFISCAL_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 200,
                                    xtype: 'combobox',
                                    fieldLabel: 'Operação',
                                    reference: 'tipo',
                                    proximoFoco: 'cfop',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.REGRAFISCAL_OPERACAO}',
                                        readOnly: '{readOnly}',
                                        store: configs.getProdutos().operacaoregras
                                    }
                                },
                                {
                                    flex: false,
                                    width: 70,
                                    fieldLabel: 'CFOP',
                                    reference: 'cfop',
                                    proximoFoco: 'nome',
                                    emptyText: '000000',
                                    fieldStyle: 'text-align: right;',
                                    maxLength: 6,
                                    minLength: 4,
                                    msgTarget: 'none',
                                    bind: {
                                        value: '{model.REGRAFISCAL_CFOP}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'checarSeExiste'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Ncm Inicial',
                                    flex: 1,
                                    tabela: 'ncms',
                                    reference: 'ncmini',
                                    proximoFoco: 'ncmfin',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['REGRAFISCAL_NCMINICIAL','NCMS_NCM'],
                                        ['NCMS_NOMEI',            'NCMS_NOME']
                                    ],
                                    bind: {
                                        value: '{model.REGRAFISCAL_NCMINICIAL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Ncm Final',
                                    flex: 1,
                                    tabela: 'ncms',
                                    reference: 'ncmfin',
                                    proximoFoco: 'origem',
                                    buscarPor: 'Genérica',
                                    associations: [
                                        ['REGRAFISCAL_NCMFINAL','NCMS_NCM'],
                                        ['NCMS_NOMEF',          'NCMS_NOME']
                                    ],
                                    bind: {
                                        value: '{model.REGRAFISCAL_NCMFINAL}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 220,
                                    xtype: 'combobox',
                                    fieldLabel: 'Origem',
                                    reference: 'uforigem',
                                    proximoFoco: 'ufdestino',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.REGRAFISCAL_ORIGEM}',
                                        readOnly: '{readOnly}',
                                        store: SamosUtils.Info.getEstadosCombo()
                                    }
                                },
{
                                    flex: false,
                                    width: 220,
                                    xtype: 'combobox',
                                    fieldLabel: 'Destino',
                                    reference: 'ufdestino',
                                    proximoFoco: 'pessoa',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.REGRAFISCAL_DESTINO}',
                                        readOnly: '{readOnly}',
                                        store: SamosUtils.Info.getEstadosCombo()
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo de Pessoa',
                                    reference: 'pessoa',
                                    proximoFoco: 'categoria',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.REGRAFISCAL_PESSOA}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['','Todos (Física/Jurídica)'],
                                            ['F','Pessoa Física'],
                                            ['J','Pessoa Jurídica']
                                        ]
                                    }
                                },
                                {
                                    flex: 1,
                                    xtype: 'combobox',
                                    fieldLabel: 'Categoria',
                                    reference: 'categoria',
                                    proximoFoco: '',
                                    forceSelection: true,
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.REGRAFISCAL_CONTRIBUINTE}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['','Todos (Contribuinte ou não)'],
                                            ['T','Contribuinte'],
                                            ['F','Não Contribuinte']
                                        ]
                                    }
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
                                        value: '{model.REGRAFISCAL_CSTIBSCBS}',
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
                                        value: '{model.REGRAFISCAL_CLASSTRIB}',
                                        store: configs.getProdutos().cclasstrib,
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        afterrender: function(combo) {
                                            combo.getPicker().setWidth(600);
                                        }
                                    }
                                }
                            ]
                        },                        
                        {
                            items: [
                                {
                                    xtype: 'numberfield',
                                    flex: false,
                                    width: 100,
                                    reference: 'prioridade',
                                    proximoFoco: 'inicio',
                                    enableKeyEvents: true,
                                    hideTrigger: true,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 0,
                                    allowDecimals: false,
                                    fieldLabel: 'Prioridade',
                                    bind: {
                                        value: '{model.REGRAFISCAL_PRIORIDADE}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    fieldLabel: 'Vigência Inicial',
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    reference: 'inicial',
                                    proximoFoco: 'final',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.REGRAFISCAL_INICIO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Vigência Final',
                                    xtype: 'datefield',
                                    width: 130,
                                    flex: false,
                                    reference: 'final',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.REGRAFISCAL_FINAL}'
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
