Ext.define('SamosAdmin.atualizacao.pessoas.form.precos.View', {
    extend: 'SamosWidgets.search.View',
    xtype: 'formpessoasprecos',

    requires: [
        'SamosAdmin.atualizacao.pessoas.form.precos.ViewModel',
        'SamosAdmin.atualizacao.pessoas.form.precos.ViewController'
    ],

    title: 'Preços Específicos',
    defaultFocus: 'textfield:editable:not([hidden]):not([disabled]):not([readOnly])',

    width: 800,
    height: 500,

    leftbuttons: [
        'Alterar'
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
                    layout: 'fit',
                    items: [
                        {
                            xtype: 'samoswidgets-griditems',
                            reference: 'produtos',
                            qtdeLinhasMinima: 1,
                            mostrarNumeroLinhas: true,
                            permitidoGridVazia: false,
                            name: 'PESSOAS_FORMULA',
                            idProperty: 'ID_ITEM',
                            descartarSeVazio: 'ID',
                            bind: {
                                store: '{precos}'
                            },
                            fields: [
                                { hidden: true, name: 'ID_ITEM'},
                                {
                                    title: 'Produto',
                                    width: 100,
                                    xtype: 'samoswidgets-textsearch',
                                    tabela: 'produtos',
                                    naoSairSeVazio: true,
                                    permitirApenasNumeros: true,
                                    fieldStyle: 'text-align:right;',
                                    buscarPor: 'Genérica',
                                    //callbackFn: 'prepararProduto',
                                    proximoFoco: 'preco',
                                    name: 'ID',
                                    bind: {
                                        readOnly: '{readOnly}'
                                    },
                                    associations:[
                                        ['ID',            'PRODUTOS_ID'],
                                        ['PRODUTOS_NOME', 'PRODUTOS_NOME'],
                                        ['RS',            'SALDOS_PRECO']
                                    ]
                                },
                                {
                                    title: 'Nome',
                                    reference: 'nomedoProduto',
                                    flex: 1,
                                    xtype: 'textfield',
                                    name: 'PRODUTOS_NOME',
                                    readOnly: true
                                },
                                {
                                    title: 'Preço',
                                    empty: true,
                                    name: 'RS',
                                    width: 120,
                                    xtype: 'samoswidgets-textmoney',
                                    mask: '#9.999.990,' + ('0'.repeat(configs.getMovimentos().casasDecimaisPreco || 2)),
                                    proximoFoco: 'produto[linhadebaixo]',
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
