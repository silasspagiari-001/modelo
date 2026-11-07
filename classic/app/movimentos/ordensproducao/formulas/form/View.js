Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formordensproducaoformulas',

    title: 'Fórmulas',

    requires: [
        'SamosAdmin.movimentos.ordensproducao.formulas.form.ViewModel',
        'SamosAdmin.movimentos.ordensproducao.formulas.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Imprimir'        
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
                    title: 'Informações',
                    items: [
                        {
                            items: [
                                {
                                    width: 105,
                                    xtype: 'samoswidgets-textsearch',
                                    fieldLabel: 'Produto',
                                    tabela: 'produtos',
                                    reference: 'produtoprincipal',
                                    proximoFoco: 'descricao',
                                    buscarPor: 'Código',
                                    permitirApenasNumeros: true,
                                    associations: [
                                        ['PRODUCOESFORMULAS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',                 'PRODUTOS_NOME'],
                                        ['PRODUCOESFORMULAS_NOME',        'PRODUTOS_NOME']
                                    ],
                                    bind: {
                                        value: '{model.PRODUCOESFORMULAS_ID_PRODUTOS}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Nome Produto',
                                    reference: 'nomeproduto',
                                    proximoFoco: 'tipo',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.PRODUTOS_NOME}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Descrição',
                                    reference: 'descricao',
                                    proximoFoco: 'tipo',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.PRODUCOESFORMULAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Log',
                                    reference: 'log',
                                    proximoFoco: 'rsdescontos',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PRODUCOESFORMULAS_LOG}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Composição',
                    layout: {
                        type: 'vbox',
                        align: 'stretch'
                    },
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'PRODUCOESFORMULAS_ITENS',
                            idProperty: 'FORMULASITENS_ID',
                            descartarSeVazio: 'FORMULASITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            listeners: {
                                antesDePublicarModel: 'calcularProduto'
                            },
                            fields: [
                                { hidden: true, name: 'FORMULASITENS_ID' },
                                { hidden: true, name: 'FORMULASITENS_ID_FORMULAS' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    proximoFoco: 'qtde',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    callbackFn: 'prepararProduto',
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'FORMULASITENS_ID_PRODUTOS',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['FORMULASITENS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',             'PRODUTOS_NOME'],
                                        ['PRODUTOS_UNIDADE',          'PRODUTOS_UNIDADE'],
                                        ['SALDOS_CUSTO',              'SALDOS_CUSTO'],//usado pra refazer os calculos
                                        ['FORMULASITENS_CUSTO',       'SALDOS_CUSTO'],//zero de percentual = T
                                        ['VALOR_TOTAL',               'SALDOS_CUSTO']
                                    ]
                                },
                                {
                                    title: 'Nome do Produto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    readOnly: true
                                },
                                {
                                    title: 'Uni',
                                    width: 50,
                                    xtype: 'textfield',
                                    hidden: configs.getClientName() != 'lislais',
                                    name: 'PRODUTOS_UNIDADE',
                                    readOnly: true
                                },
                                {
                                    empty: true,
                                    title: 'Qtde',
                                    name: 'FORMULASITENS_QUANTIDADE',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: (configs.getClientName() == 'malacrida') ? '#9.999.990,000000' : '#9.999.990,000',
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true,
                                    title: 'Valor',
                                    name: 'FORMULASITENS_CUSTO',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    readOnly: true
                                },
                                {
                                    empty: true,
                                    title: 'Total',
                                    name: 'VALOR_TOTAL',
                                    width: 100,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    readOnly: true
                                },
                                {
                                    title: '% Perc',
                                    name: 'FORMULASITENS_PERCENTUAL',
                                    forceSelection: true,
                                    emptyText: '',
                                    proximoFoco: 'produto[linhadebaixo]',
                                    editable: false,
                                    flex: false,
                                    width : 105,
                                    xtype: 'combobox',
                                    displayField: 'field2',
                                    store: [
                                        ['F', 'Não'],
                                        ['T', 'Sim']
                                    ],
                                    bind: {
                                        readOnly: '{readOnly}'
                                    }
                                },
                                { hidden: true, name: 'SALDOS_CUSTO' }
                            ]
                        },
                        {
                            items: [
                                {
                                    xtype: 'component',
                                    flex: 1,
                                },
                                {
                                    width: 150,
                                    fieldLabel: 'Total',
                                    labelAlign: 'right',
                                    labelWidth: 50,
                                    reference: 'total',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,000',
                                    readOnly: true,
                                    ui: 'field-readonly',
                                    bind: {
                                        value: '{model.VALOR_TOTAL}'
                                    }
                                },
                                {
                                    xtype: 'component',
                                    width: 100,
                                }
                            ]
                        }
                    ]
                },
                {
                    items: [
                        
                    ]
                }
            ]
        });
        this.callParent(arguments);
    }
});
