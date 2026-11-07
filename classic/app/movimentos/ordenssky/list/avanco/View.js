Ext.define('SamosAdmin.movimentos.ordenssky.list.avanco.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'ordensskyavanco',

    requires: [
        'SamosAdmin.movimentos.ordenssky.list.avanco.ViewModel',
        'SamosAdmin.movimentos.ordenssky.list.avanco.ViewController'
    ],

    title: 'Avanço de Material',
    modelName: 'SamosAdmin.atualizacao.produtos.Model',

    controller: 'ordensskyavanco',
    viewModel: 'ordensskyavanco',

    rightbuttons: [
        'Gravar',
        'Sair'
    ],

    initComponent: function () {
        Ext.apply(this, {
            leftbuttons: [
                {
                    fieldLabel: 'Selecionar Técnico',
                    xtype: 'combobox',
                    ui: 'textbold-basic',
                    width: 280,
                    labelWidth: 120,
                    margin: '10 0 0 10',
                    reference: 'comboSelecionarTecnico',
                    labelAlign: 'left',
                    forceSelection: true,
                    displayField: 'field2',
                    store: configs.getOrdens().tecnicos.map(tecnico => {
                        return [
                            tecnico['USUARIOS_ID'], 
                            tecnico['USUARIOS_LOGIN']
                        ];
                    }),
                    bind: {
                        readOnly: '{updating}'
                    },
                    listeners: {
                        change: 'carregarMaterial'
                    }
                }
            ],

            formgroups: [
                {
                    collapsible: false,
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'gridordensskyavanco',
                            qtdeLinhasMinima: 1,
                            name: 'ORDENS_ROTAS',
                            idProperty: 'ORDENSROTAS_ID_CIDADES',
                            descartarSeVazio: 'CIDADES_NOME',
                            bind: {
                                store: '{ordensskyavanco}'
                            },
                            listeners: {
                                //aposCarregar: 'aposCarregarRotas'
                            },
                            fields: [
                                {
                                    title: 'Produto',
                                    xtype: 'textfield',
                                    width: 70,
                                    readOnly: true,
                                    reference: 'produto',
                                    proximoFoco: 'descricao',
                                    name: 'PRODUTOS_ID'
                                },
                                {
                                    title: 'Descrição',
                                    xtype: 'textfield',
                                    flex: 1,
                                    readOnly: true,
                                    reference: 'descricao',
                                    proximoFoco: 'saldomaster',
                                    name: 'PRODUTOS_NOME'
                                },
                                {
                                    title: 'Saldo Master',                                                                            
                                    xtype: 'numberfield',
                                    name: 'SALDO_MASTER',
                                    width: 110,                                                                            
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    reference: 'saldomaster',
                                    proximoFoco: 'saldotecnico',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    readOnly: true
                                },
                                {
                                    title: 'Saldo Técnico',                                                                            
                                    xtype: 'numberfield',
                                    name: 'SALDO_TECNICO',
                                    width: 110,                                                                            
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    reference: 'saldotecnico',
                                    proximoFoco: 'qtdeavancar',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    readOnly: true
                                },
                                {
                                    title: 'Avançar',                                                                            
                                    xtype: 'numberfield',
                                    name: 'QTDE_AVANCAR',
                                    enableKeyEvents: true,
                                    naoSairSeVazio: true,
                                    width: 80,                                                                            
                                    decimalPrecision: 0,
                                    msgTarget: 'qtip',
                                    hideTrigger: true,
                                    reference: 'qtdeavancar',
                                    proximoFoco: 'qtdeavancar[linhadebaixo]',
                                    fieldStyle: {
                                        textAlign: 'right'
                                    },
                                    bind: {    
                                        readOnly: '{readOnly}'
                                    }
                                },
                                { hidden: true, name: 'SALDOS_PRECO' },
                                { hidden: true, name: 'SALDOS_CUSTO' }
                            ]
                        }
                    ]
                }
            ]
        });

        this.callParent(arguments);
    }
});
