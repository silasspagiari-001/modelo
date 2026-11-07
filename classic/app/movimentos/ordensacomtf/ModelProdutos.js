Ext.define('SamosAdmin.movimentos.ordensacomtf.ModelProdutos', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSPRODUTOS_ID',
    idParent: 'ORDENSPRODUTOS_ID_ORDENS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENSPRODUTOS_QUANTIDADE' : 0,
            'ORDENSPRODUTOS_PRECO'      : 0,
            'ORDENSPRODUTOS_CUSTO'      : 0,
            'ORDENSPRODUTOS_PERCENTUAL' : 0,
            'ORDENSPRODUTOS_DESCONTOS'  : 0,
            'ORDENSPRODUTOS_TOTAL'      : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENSPRODUTOS_ID',
        'ORDENSPRODUTOS_ID_ORDENS',
        'ORDENSPRODUTOS_ID_OPERACOES',
        {
            name: 'ORDENSPRODUTOS_ID_PRODUTOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUTOS_NOME',
        {
            name: 'ORDENSPRODUTOS_QUANTIDADE',
            validators: [
                {type: 'range', min: 1, allowBlank: false}
            ]
        },
        {
            name: 'ORDENSPRODUTOS_PRECO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSPRODUTOS_CUSTO',
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENSPRODUTOS_DESCONTOS',
        'ORDENSPRODUTOS_PERCENTUAL',
        'ORDENSPRODUTOS_TOTAL'
    ]
});
