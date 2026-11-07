Ext.define('SamosAdmin.movimentos.telemarketing.detalhes.form.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formdetalhestelemarketing',

    requires: [
        'SamosAdmin.movimentos.telemarketing.detalhes.form.ViewModel',
        'SamosAdmin.movimentos.telemarketing.detalhes.form.ViewController'
    ],

    title: 'Telemarketing',
    hidePaging: true,
    width: 850,
    height: 350,

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
                                    xtype: 'datefield',
                                    width: 115,
                                    flex: false,
                                    fieldLabel: 'Data',
                                    reference: 'data',
                                    bind: {
                                        proximoFoco: 'situacao',
                                        readOnly: true,
                                        ui: 'field-readonly',
                                        value: '{model.TELEMARKETING_EMISSAO}'
                                    }
                                },
                                {
                                    flex: false,
                                    width: 75,
                                    fieldLabel: 'Hora',
                                    reference: 'hora',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.TELEMARKETING_CEP}'
                                    }
                                },
                                {
                                    flex: 1,
                                    reference: 'pessoa',
                                    fieldLabel: 'Nome do Cliente',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_NOME}'
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
                                                'Telefone' : 'Telefone Fixo'),
                                    reference: 'telefone',
                                    maxLength: 15,
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_TELEFONE}'
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
                                    maxLength: 15,
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PESSOAS_CELULAR}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    width: 195,
                                    xtype: 'combobox',
                                    fieldLabel: 'Situação',
                                    reference: 'situacao',
                                    proximoFoco: 'contato',
                                    forceSelection: true,
                                    editable: false,                                            
                                    displayField: 'field2',
                                    bind: {
                                        value: '{model.TELEMARKETING_STATUS}',
                                        readOnly: '{readOnly}',
                                        store: [
                                            ['A', 'Não localizado'],
                                            ['B', 'Localizado'],
                                            ['C', 'Venda realizada'],
                                            ['D', 'Preço questionado'],
                                            ['E', 'Prazo questionado'],                                            
                                            ['F', 'Sem produto Estoque'],
                                            ['G', 'Aniversariante'],
                                            ['H', 'Pós-venda']
                                        ]
                                    }
                                },
                                {
                                    xtype: 'textfield',
                                    flex: 1,
                                    fieldLabel: 'Contato',
                                    reference: 'contato',
                                    proximoFoco: 'proximo',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.TELEMARKETING_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    xtype: 'datefield',
                                    fieldLabel: 'Próximo Contato',                                    
                                    width: 130,
                                    flex: false,
                                    reference: 'proximo',
                                    proximoFoco: 'observacoes',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.TELEMARKETING_PROXIMO}'
                                    }
                                },
                                {
                                    fieldLabel: 'Hora Marcada',
                                    width: 130,
                                    flex: false,
                                    xtype: 'combobox',
                                    reference: 'horaproximo',
                                    bind: {
                                        readOnly: '{readOnly}',
                                        value: '{model.TELEMARKETING_NUMERO}',
                                    },
                                    store: SamosUtils.Info.getHorarios(),
                                    forceSelection: false,
                                    enableKeyEvents: true
                                }

                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'textarea',
                                    fieldLabel: 'Observações',
                                    flex: 1,
                                    height: 118,
                                    maxLength: 512,
                                    reference: 'observacoes',
                                    bind: {
                                        value: '{model.TELEMARKETING_OBSERVACOES}',
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
