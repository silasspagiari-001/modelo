Ext.define('SamosAdmin.movimentos.ordensproducao.ModelProdutos', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRODUCOESITENS_ID',
    idParent: 'PRODUCOESITENS_ID_PRODUCOES',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'PRODUCOESITENS_QUANTIDADE' : 1
        };

        this.callParent(arguments);
    },

    fields: [
        'PRODUCOESITENS_ID',
        'PRODUCOESITENS_ID_PRODUCOES',
        {
            name: 'PRODUCOESITENS_ID_PRODUTOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUCOESITENS_QUANTIDADE',
        {
            name: 'PRODUCOESITENS_CUSTO',
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});
