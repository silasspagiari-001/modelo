Ext.define('SamosAdmin.processos.estoque.View', {
    extend: 'SamosModule.form.View',
    xtype: 'processosestoque',

    requires: [
        'SamosAdmin.processos.estoque.ViewController',
        'SamosAdmin.processos.estoque.ViewModel'
    ],

    rightbuttons: [
        'Atualizar',
        'Sair'
    ],
    
    constructor: function () {
        Ext.apply(this, {
            formgroups: [
                {
                    items: [
                        {
                            xtype: 'datefield',
                            fieldLabel: 'Data Base',
                            reference: 'inicio',
                            proximoFoco: 'final',
                            flex: false,
                            width: 125,
                            bind: {
                                value: '{valueDiacalculo}'
                            }
                        }
                    ],
                    hidden: configs.getClientName() != 'malacrida'
                },
                {
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'MOVIMENTOS_ITENS',
                            idProperty: 'MOVIMENTOSITENS_ID',
                            descartarSeVazio: 'MOVIMENTOSITENS_ID_PRODUTOS',
                            bind: {
                                store: '{produtos}'
                            },
                            fields: [
                                { hidden: true, name: 'MOVIMENTOSITENS_ID' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    callbackFn: 'prepararProduto',
                                    name: 'MOVIMENTOSITENS_ID_PRODUTOS',
                                    proximoFoco: 'novoSaldo',                                    
                                    readOnly: false,
                                    associations:[
                                        ['MOVIMENTOSITENS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',               'PRODUTOS_NOME'],
                                        ['SALDOS_DISPONIVEL',           'SALDOS_DISPONIVEL'],
                                        ['SALDOS_CUSTO',                'SALDOS_CUSTO']
                                    ]
                                },
                                {
                                    title: 'Nome do Produto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    maxLength: 100,                                    
                                    readOnly: true
                                },
                                {
                                    title: 'Saldo Atual',
                                    name: 'SALDOS_DISPONIVEL',
                                    width: 100,
                                    xtype: 'numberfield',
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    }
                                },
                                {
                                    title: 'Novo Saldo',
                                    name: 'MOVIMENTOSITENS_QUANTIDADE',
                                    xtype: 'numberfield',
                                    width: 100,
                                    enableKeyEvents: true,
//                                  naoSairSeVazio: true,
                                    submitLocaleSeparator: false,
                                    decimalSeparator: ',',
                                    decimalPrecision: 3,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    proximoFoco: 'produto[linhadebaixo]',
                                    readOnly: false,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    }
                                },
                                { name: 'SALDOS_CUSTO', hidden: true }
                            ]
                        }
                    ]
                }
            ]
        });
        
        this.callParent(arguments);
    }
});
