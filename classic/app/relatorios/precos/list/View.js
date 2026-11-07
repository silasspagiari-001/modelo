Ext.define('SamosAdmin.relatorios.precos.list.View', {
    extend: 'SamosModule.list.View',
    xtype: 'relatoriosprecoslist',

    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    requires: [
        'SamosAdmin.relatorios.precos.list.ViewController',
        'SamosAdmin.relatorios.precos.list.ViewModel'
    ],

    leftbuttons: [
        'Imprimir'
    ],

    rightbuttons: [
        'Sair'
    ],

    constructor: function() {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            items: [
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    flex: 1,
                                    forceSelection: true,
                                    editable: false,
                                    store: [
                                        [0, 'Normal'],
                                        [1, 'Normal e Promoção'],
                                        [2, 'Promoção'],
                                        [3, 'Apenas descrição']

                                    ],
                                    bind: {
                                        value: '{valueTipo}'
                                    }
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: 'Situação',
                                    flex: 1,
                                    forceSelection: true,
                                    editable: false,
                                    store: [
                                        [0, 'Com Saldo Positivo'],
                                        [1, 'Todos']
                                    ],
                                    bind: {
                                        value: '{valueSituacao}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    tabela: 'produtos',
                                    buscarPor: 'Genérica',
                                    obrigatorio: true,
                                    msgObrigatorio: 'Produto inicial obrigatório!',
                                    obrigatorio: true,
                                    flex: 1,
                                    fieldLabel: 'Produto',
                                    reference: 'produtoinicial',
                                    proximoFoco: 'produtofinal',
                                    hideTrigger: false,            
                                    emptyText: '1',
                                    allowDecimals: false,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    maxLength: 6,
                                    //Callback personalizado e associação com o vm
                                    callbackFn: 'onAposPesquisarTextSearch',
                                    callbackDelay: 100,
                                    vmAssociations: [
                                        ['PRODUTOS_ID',   'valueProduto']
                                    ],
                                    bind: {
                                        value: '{valueProduto}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    tabela: 'produtos',
                                    buscarPor: 'Genérica',
                                    obrigatorio: true,
                                    msgObrigatorio: 'Produto final obrigatório!',
                                    flex: 1,
                                    fieldLabel: 'Até',
                                    reference: 'produtofinal',
                                    hideTrigger: false,            
                                    emptyText: '999999',
                                    allowDecimals: false,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    maxLength: 6,
                                    //Callback personalizado e associação com o vm
                                    callbackFn: 'onAposPesquisarTextSearch',
                                    callbackDelay: 100,
                                    vmAssociations: [
                                        ['PRODUTOS_ID',   'valueAte']
                                    ],
                                    bind: {
                                        value: '{valueAte}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    tabela: 'grupos',
                                    buscarPor: 'Genérica',
                                    obrigatorio: true,
                                    msgObrigatorio: 'Grupo inicial obrigatório!',
                                    flex: 1,
                                    fieldLabel: 'Grupo',
                                    reference: 'grupoinicial',
                                    proximoFoco: 'grupofinal',
                                    hideTrigger: false,            
                                    emptyText: '1',
                                    allowDecimals: false,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    maxLength: 6,
                                    //Callback personalizado e associação com o vm
                                    callbackFn: 'onAposPesquisarTextSearch',
                                    callbackDelay: 100,
                                    vmAssociations: [
                                        ['GRUPOS_ID', 'valueGrupo']
                                    ],
                                    bind: {
                                        value: '{valueGrupo}'
                                    }
                                },
                                {
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    tabela: 'grupos',
                                    buscarPor: 'Genérica',
                                    obrigatorio: true,
                                    msgObrigatorio: 'Grupo final obrigatório!',
                                    flex: 1,
                                    fieldLabel: 'Final',
                                    reference: 'grupofinal',
                                    hideTrigger: false,            
                                    emptyText: '9999',
                                    allowDecimals: false,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 1,
                                    maxLength: 6,
                                    //Callback personalizado e associação com o vm
                                    callbackFn: 'onAposPesquisarTextSearch',
                                    callbackDelay: 100,
                                    vmAssociations: [
                                        ['GRUPOS_ID', 'valueFinal']
                                    ],
                                    bind: {
                                        value: '{valueFinal}'
                                    }
                                }
                            ]
                        },
                        {
                            items: [
                                {
                                    flex: 1,
                                    xtype: 'samoswidgets-adaptative-textsearch',
                                    fieldLabel: 'Fornecedor',
                                    tabela: 'pessoas',
                                    complement: 'idpessoa',
                                    reference: 'pessoa',
                                    proximoFoco: 'buscar',
                                    buscarPor: 'Genérica',
                                    vmAssociations: [
                                        ['PESSOAS_ID',   'valueIdPessoa']
                                    ],
                                    campoModelMostrarAposBuscar: 'PESSOAS_NOME'        
                                },
                                {
                                    hidden: true,
                                    fieldLabel: 'IdPessoa',
                                    itemId: 'idpessoa'
                                }        
                            ]
                        }
                    ]
                }
            ]
        })

        this.callParent(arguments);
    }
});
