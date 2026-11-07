Ext.define('SamosAdmin.atualizacao.operadoras.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'OPERADORAS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/operadoras'
    },

    constructor: function () {
        this.defaultValues = {
            'OPERADORAS_TIPO' : 'C'
        };
        this.callParent(arguments);
    },

    fields: [
        'OPERADORAS_ID',
        {
            name: 'OPERADORAS_STATUS',//  CHAR(1),
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'OPERADORAS_TIPO',//  CHAR(1),
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'OPERADORAS_NOME',//  VARCHAR(20),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },        
        'OPERADORAS_AVISTA',//  VARCHAR(20),
        'OPERADORAS_PARCELADO'//  VARCHAR(20),
    ]
});
