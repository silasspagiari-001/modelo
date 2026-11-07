Ext.define('SamosAdmin.movimentos.ordenseleve.fotos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/fotosordenseleve',
        timeout: 600000000
    },

    constructor: function () {
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
