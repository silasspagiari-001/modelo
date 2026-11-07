Ext.define('SamosAdmin.atualizacao.relacoes.form.View', {
    extend: 'SamosModule.form.View',
    xtype: 'formrelacoes',

    title: 'Relações',

    requires: [
        'SamosAdmin.atualizacao.relacoes.form.ViewModel',
        'SamosAdmin.atualizacao.relacoes.form.ViewController'
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
                                    xtype: 'numberfield',
                                    flex: 1,
                                    fieldLabel: 'Produto Web',
                                    reference: 'produtoweb',
                                    proximoFoco: 'nome',
                                    emptyText: '0',
                                    hideTrigger: true,
                                    allowDecimals: false,
                                    fieldStyle: 'text-align: right;',
                                    minValue: 0,
                                    maxLength: 10,
                                    bind: {
                                        value: '{model.RELACOES_ID_PRODUTOS}',
                                        readOnly: '{readOnly}'
                                    },
                                    listeners: {
                                        keydown: 'checarSeExiste'
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
                            name: 'RELACOES_ITENS',
                            idProperty: 'RELACOESITENS_ID',
                            descartarSeVazio: 'RELACOESITENS_ID_ITENS',
                            bind: {
                                store: '{produtos}'
                            },
                            fields: [
                                { hidden: true, name: 'RELACOESITENS_ID' },
                                { hidden: true, name: 'RELACOESITENS_ID_MOVIMENTOS' },
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    name: 'RELACOESITENS_ID_ITENS',
                                    callbackFn: 'publicarModel',                       
                                    bind: {
                                        proximoFoco: 'produto[linhadebaixo]',
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['RELACOESITENS_ID_ITENS',    'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME',             'PRODUTOS_NOME'],
                                        ['SALDOS_DISPONIVEL',         'SALDOS_DISPONIVEL'],
                                        ['SALDOS_PRECO',              'SALDOS_PRECO']
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
                                    title: 'Saldo',
                                    name: 'SALDOS_DISPONIVEL',
                                    width: 100,
                                    xtype: 'numberfield',
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
                                    }
                                },
                                {
                                    title: 'Preço',
                                    name: 'SALDOS_PRECO',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    empty: true,                                    
                                    readOnly: true,
                                    fieldStyle: {
                                        textAlign: 'right'
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
