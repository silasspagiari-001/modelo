Ext.define('SamosAdmin.movimentos.ordensveiculos.fotos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/fotosordensveiculos',
        timeout: 600000000
    },

    constructor: function () {
        /*
        this.defaultValues = {
            'FOTOS_DATA': moment().format('YYYY-MM-DD'),
            'FOTOS_HORA': moment().format('hh:mm:ss')
        };*/

        this.callParent(arguments);
    },

    fields: [
        {
            name: 'FOTOS_NOME',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FOTOS_DATA',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FOTOS_HORA',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'FOTOS_BYTES',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'FOTOS_EXTENSAO',
        {
            name: 'FOTOS_BASE64',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});
