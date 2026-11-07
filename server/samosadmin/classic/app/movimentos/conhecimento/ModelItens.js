Ext.define('SamosAdmin.movimentos.conhecimento.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CONHECIMENTOSITENS_ID',
    idParent: 'CONHECIMENTOSITENS_ID_CONHECTO',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'CONHECIMENTOSITENS_TOTAL'      : 0,
            'CONHECIMENTOSITENS_PESOLIQUIDO': 0,
            'CONHECIMENTOSITENS_EMISSAO'    : momentServer().format('YYYY-MM-DD')
        };

        this.callParent(arguments);
    },

    fields: [
        'CONHECIMENTOSITENS_ID',
        'CONHECIMENTOSITENS_ID_CONHECTO',
        {
            name: 'CONHECIMENTOSITENS_NUMERO', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOSITENS_SERIE', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOSITENS_NFE', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOSITENS_EMISSAO', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOSITENS_TOTAL', 
            validators: [
                {type: 'presence'}
            ]
        },
        'CONHECIMENTOSITENS_PESOLIQUIDO'
    ]
});
