Ext.define('SamosAdmin.movimentos.manifestos.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MANIFESTOSITENS_ID',
    idParent: 'MANIFESTOSITENS_ID_MANIFESTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'MANIFESTOSITENS_PRODUTOS'   : 0,
            'MANIFESTOSITENS_TOTAL'      : 0,
            'MANIFESTOSITENS_PESOLIQUIDO': 0,
            'MANIFESTOSITENS_EMISSAO'    : momentServer().format('YYYY-MM-DD')
        };

        this.callParent(arguments);
    },

    fields: [
        'MANIFESTOSITENS_ID',
        'MANIFESTOSITENS_ID_MANIFESTOS',
        'MANIFESTOSITENS_NUMERO',
        'MANIFESTOSITENS_SERIE',
        {
            name: 'MANIFESTOSITENS_NFE', 
            validators: [
                {type: 'presence'}
            ]
        },
        'MANIFESTOSITENS_PROTOCOLO',
        {
            name: 'MANIFESTOSITENS_EMISSAO', 
            type: 'nodejsdate'
        },
        'MANIFESTOSITENS_PRODUTOS', 
        'MANIFESTOSITENS_TOTAL', 
        'MANIFESTOSITENS_PESOLIQUIDO',
        'MANIFESTOSITENS_ID_CIDADES', 
        {
            name: 'CIDADES_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        'CIDADES_ESTADO',
        'CIDADES_IBGE'
    ]
});
