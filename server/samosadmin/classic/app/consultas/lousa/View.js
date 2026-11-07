Ext.define('SamosAdmin.consultas.lousa.View', {
    extend: 'SamosModule.form.View',
    xtype: 'lousa',

    requires: [
        'SamosAdmin.consultas.lousa.ViewController',
        'SamosAdmin.consultas.lousa.ViewModel'
    ],

    rightbuttons: [
        'Limpar Lousa',
        'Imprimir',
        'Sair'
    ],
    
    constructor: function () {
        Ext.apply(this, {
            formgroups: [                
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
                            listeners: {
                                antesDePublicarModel: 'calcularProduto',
                                aposPublicarModel: 'fazerSomas'
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
                                    proximoFoco: 'quantidade',
                                    readOnly: false,
                                    associations:[
                                        ['MOVIMENTOSITENS_ID_PRODUTOS', 'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',               'PRODUTOS_NOME'],
                                        ['PRODUTOS_DESCRICAO',          'PRODUTOS_DESCRICAO'],
                                        ['SALDOS_PRECO',                'SALDOS_PRECO'],                                        
                                        ['PRECOMINIMO_DB',              'PRECOMINIMO_DB'],
                                        ['SALDOS_PRAZO',                'SALDOS_PRAZO']
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
                                    title: 'Quantidade',
                                    name: 'MOVIMENTOSITENS_QUANTIDADE',
                                    xtype: 'numberfield',
                                    width: 100,
                                    enableKeyEvents: true,
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
                                {
                                    title: 'R$ Parcelado',
                                    readOnly: true,
                                    name: 'MOVIMENTOSITENS_PRECO',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.999'
                                },
                                {
                                    title: 'R$ À Vista',
                                    readOnly: true,
                                    name: 'MOVIMENTOSITENS_BASEICMS',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.999'
                                },
                                {
                                    title: 'R$ Promoção',
                                    readOnly: true,
                                    name: 'MOVIMENTOSITENS_BASEST',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.999'
                                },
                                { name: 'PRODUTOS_DESCRICAO', hidden: true},
                                { name: 'SALDOS_PRECO', hidden: true},
                                { name: 'PRECOMINIMO_DB', hidden: true},
                                { name: 'SALDOS_PRAZO', hidden: true}
                            ]
                        },

                    ]
                },
                {
                    height: 90,
                    items: [
                        {   
                            defaults: {
                                xtype: 'container',                                                                
                                layout: 'hbox'
                            },
                            items: [
                                {
                                    xtype: 'container',
                                    padding: '0',
                                    defaultType: 'fieldcontainer',
                                    layout: 'vbox',
                                    flex: 3,
                                    height: 100
                                },
                                {
                                    fieldLabel: 'Total Parcelado',
                                    reference: 'totalparcelado',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.999',
                                    width: 110,
                                    readOnly: true,
                                    bind: {
                                        value: '{model.PARCELADO_TOTAL}'
                                    }    
                                },
                                {
                                    fieldLabel: 'Total à Vista',
                                    reference: 'totalavista',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.999',
                                    width: 110,
                                    readOnly: true,
                                    bind: {
                                        value: '{model.AVISTA_TOTAL}'
                                    }
                                },
                                {
                                    fieldLabel: 'Total Promoção',
                                    reference: 'totalpromocao',
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.999',                                    
                                    width: 110,
                                    readOnly: true,                                    
                                    bind: {
                                        value: '{model.PROMOCAO_TOTAL}'
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