Ext.define('SamosAdmin.atualizacao.custos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CUSTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/custos'
    },

    constructor: function () {
        this.defaultValues = {
            'CUSTOS_STATUS': 'T',
            'CUSTOS_TIPO': 'D',
            'CUSTOS_MASCARA': ''
        };
        this.callParent(arguments);
    },
    fields: [
        'CUSTOS_ID',
        {
            name: 'CUSTOS_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'CUSTOS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'CUSTOS_MASCARA',
            validators: [
                {type: 'length', max: 13}
            ]
        },
        {
            name: 'CUSTOS_TIPO',
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});