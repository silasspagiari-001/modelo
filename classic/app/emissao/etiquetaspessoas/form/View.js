Ext.define('SamosAdmin.emissao.etiquetaspessoas.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formemissaoetiquetaspessoas',

    title: 'Etiqueta',

    requires: [
        'SamosAdmin.emissao.etiquetaspessoas.form.ViewModel',
        'SamosAdmin.emissao.etiquetaspessoas.form.ViewController'
    ],

    leftbuttons: [
        'Novo',
        'Alterar',
        'Excluir',
        'Cancelar Impressão'
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
                                    proximoFoco: 'produto0',
                                    displayField: 'field2',
                                    store: configs.getEmissao().etiquetaPessoas.tipos,
                                    bind: {
                                        value: '{model.TIPO}',
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
                    title: 'Pessoas',
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'pessoas',
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'ETIQUETAS_ITENS',
                            idProperty: 'ETIQUETASITENS_ID',
                            descartarSeVazio: 'ETIQUETASITENS_ID_PESSOAS',
                            bind: {
                                store: '{pessoas}'
                            },
                            fields: [
                                { hidden: true, name: 'ETIQUETASITENS_ID' },
                                { hidden: true, name: 'ETIQUETASITENS_ID_ETIQUETAS' },
                                {
                                    title: 'Pessoa',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'pessoas',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'ETIQUETASITENS_ID_PESSOAS',
                                    callbackFn: 'prepararPessoa',
                                    proximoFoco: 'qtde',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['ETIQUETASITENS_ID_PESSOAS', 'PESSOAS_ID'],
                                        ['PESSOAS_NOME',              'PESSOAS_NOME']
                                    ]
                                },
                                {
                                    title: 'Nome da Pessoa',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PESSOAS_NOME',
                                    proximoFoco: 'qtde',
                                    readOnly: true
                                },
                                {
                                    name: 'ETIQUETASITENS_QUANTIDADE',
                                    title: 'Qtde',
                                    width: 100,                                                                            
                                    xtype: 'numberfield',
                                    proximoFoco: 'pessoa[linhadebaixo]',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    minValue: '1',
                                    decimalPrecision: 0,
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
