Ext.define('SamosAdmin.emissao.etiquetasprodutos.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formemissaoetiquetas',

    title: 'Etiqueta',

    requires: [
        'SamosAdmin.emissao.etiquetasprodutos.form.ViewModel',
        'SamosAdmin.emissao.etiquetasprodutos.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Emitir: Com Promoção, Sem Promoção', 
        'Produtos'
    ],

    rightbuttons: [
        'Gravar',
        'Cancelar',
        'Sair'
    ],

    constructor: function () {
        SamosUtils.Utils.adicionarBotaoImpressao({
            btnName   : 'Imprimir',
            showLayout: true,
            index     : 4,
            visualizar: false,
            view      : this
        });

        Ext.apply(this, {
            formgroups: [
                {
                    title: 'Informações',
                    items: [
                        {
                            items: [
                                {
                                    width: 65,
                                    fieldLabel: 'Código',
                                    reference: 'codigo',
                                    bind: '{modelId}',
                                    ui: 'field-readonly',
                                    fieldStyle: 'text-align:right;',
                                    readOnly: true
                                },
                                {
                                    width: 120,
                                    xtype: 'combobox',
                                    fieldLabel: 'Status',
                                    reference: 'status',
                                    displayField: 'field2',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    store: [
                                        ['F', 'Não impressa'],
                                        ['I', 'Imprimindo'],
                                        ['T', 'Impressa']
                                    ],
                                    bind: {
                                        value: '{model.ETIQUETAS_STATUS}'                                      
                                    }
                                },
                                {
                                    width: 95,
                                    xtype: 'datefield',
                                    fieldLabel: 'Emissão',
                                    ui: 'field-readonly',
                                    readOnly: true,
                                    bind: {
                                        value: '{model.ETIQUETAS_EMISSAO}',
                                    }
                                },
                                {
                                    flex: 1,
                                    fieldLabel: 'Nome',
                                    reference: 'nome',
                                    proximoFoco: 'tipo',
                                    maxLength: 50,
                                    bind: {
                                        value: '{model.ETIQUETAS_NOME}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    width: 130,
                                    xtype: 'combobox',
                                    fieldLabel: 'Tipo',
                                    reference: 'tipo',
                                    proximoFoco: 'layout',
                                    displayField: 'field2',
                                    store: configs.getEmissao().etiquetaProdutos.tipos,
                                    bind: {
                                        value: '{model.TIPO}',
                                        readOnly: '{readOnly}'                              
                                    }
                                },
                                {
                                    width: 130,
                                    xtype: 'combobox',
                                    fieldLabel: 'Layout',
                                    reference: 'layout',
                                    proximoFoco: 'produto0',
                                    displayField: 'field2',
                                    store: configs.getEmissao().etiquetaProdutos.layouts,
                                    hidden: (configs.getEmissao().etiquetaProdutos.layouts || []).length == 0,
                                    bind: {
                                        value: '{model.ETIQUETAS_LAYOUT}',
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
                                        value: '{model.ETIQUETAS_LOG}'
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    title: 'Produtos',
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'ETIQUETAS_ITENS',
                            idProperty: 'ETIQUETASITENS_ID',
                            descartarSeVazio: 'ETIQUETASITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            fields: [
                                { hidden: true, name: 'ETIQUETASITENS_ID' },
                                { hidden: true, name: 'ETIQUETASITENS_ID_ETIQUETAS' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'ETIQUETASITENS_ID_PRODUTOS',
                                    callbackFn: 'prepararProduto',
                                    bind: {
                                        proximoFoco: '{tipoAplicacao ? "nomedoProduto" : "qtde"}',
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['ETIQUETASITENS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',              'PRODUTOS_NOME'],
                                        ['ETIQUETASITENS_MODELO',      'PRODUTOS_DESCRICAO'],
                                        ['ETIQUETASITENS_APLICACAO',   'PRODUTOS_APLICACAO'],
                                        ['SALDOS_PRECO',               'SALDOS_PRECO'],
                                        ['SALDOS_PRAZO',               'SALDOS_PRAZO']
                                    ]
                                },
                                {
                                    title: 'Nome do Produto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    proximoFoco: 'modelo',
                                    bind: {
                                        readOnly: '{tipoAplicacao ? readOnly : true}'
                                    }
                                },
                                {
                                    title: 'Modelo',
                                    width: 100,
                                    xtype: 'textfield',
                                    proximoFoco: 'aplicacao',
                                    name: 'ETIQUETASITENS_MODELO',
                                    bind: {
                                        hidden: '{!tipoAplicacao}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    title: 'Aplicação',
                                    width: 100,
                                    xtype: 'textfield',
                                    name: 'ETIQUETASITENS_APLICACAO',
                                    proximoFoco: 'preco',
                                    bind: {
                                        hidden: '{!tipoAplicacao}',
                                        readOnly: '{readOnly}'
                                    }
                                },
                                {
                                    empty: true,
                                    title: 'Preço',
                                    name: (configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO'),
                                    width: 95,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,00',
                                    proximoFoco: 'qtde',
                                    bind: {
                                        readOnly: '{tipoAplicacao ? readOnly : true}'
                                    }
                                },
                                {
                                    name: 'ETIQUETASITENS_QUANTIDADE',
                                    title: 'Qtde',
                                    width: 100,                                                                            
                                    xtype: 'numberfield',
                                    proximoFoco: 'produto[linhadebaixo]',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: '0.001',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {    
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
