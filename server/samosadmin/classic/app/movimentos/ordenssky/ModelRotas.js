Ext.define('SamosAdmin.movimentos.ordenssky.ModelRotas', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSROTAS_ID_CIDADES',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordenssky/rotas',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENSROTAS_ID_CIDADES': 0,
            'USUARIOS_ID_SEGUNDA'   : 0,
            'USUARIOS_ID_TERCA'     : 0,
            'USUARIOS_ID_QUARTA'    : 0,
            'USUARIOS_ID_QUINTA'    : 0,
            'USUARIOS_ID_SEXTA'     : 0,
            'USUARIOS_ID_SABADO'    : 0,
            'USUARIOS_ID_DOMINGO'   : 0,
            'LIMITE_SEGUNDA'        : 10,
            'LIMITE_TERCA'          : 10,
            'LIMITE_QUARTA'         : 10,
            'LIMITE_QUINTA'         : 10,
            'LIMITE_SEXTA'          : 10,
            'LIMITE_SABADO'         : 10,
            'LIMITE_DOMINGO'        : 10
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENSROTAS_ID_CIDADES',
        'CIDADES_NOME',
        'ROTAS_ID_SEGUNDA',
        'ROTAS_ID_TERCA',
        'ROTAS_ID_QUARTA',
        'ROTAS_ID_QUINTA',
        'ROTAS_ID_SEXTA',
        'ROTAS_ID_SABADO',
        'ROTAS_ID_DOMINGO',
        'USUARIOS_ID_SEGUNDA',
        'USUARIOS_ID_TERCA',
        'USUARIOS_ID_QUARTA',
        'USUARIOS_ID_QUINTA',
        'USUARIOS_ID_SEXTA',
        'USUARIOS_ID_SABADO',
        'USUARIOS_ID_DOMINGO',
        'USUARIOS_SEGUNDA',
        'USUARIOS_TERCA',
        'USUARIOS_QUARTA',
        'USUARIOS_QUINTA',
        'USUARIOS_SEXTA',
        'USUARIOS_SABADO',
        'USUARIOS_DOMINGO',
        'LIMITE_SEGUNDA',
        'LIMITE_TERCA',
        'LIMITE_QUARTA',
        'LIMITE_QUINTA',
        'LIMITE_SEXTA',
        'LIMITE_SABADO',
        'LIMITE_DOMINGO',
        {
            name: 'STATUS_SEGUNDA',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'STATUS_TERCA',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'STATUS_QUARTA',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'STATUS_QUINTA',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'STATUS_SEXTA',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'STATUS_SABADO',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'STATUS_DOMINGO',
            type: 'check',
            defaultValue: 'T'
        }
    ]
});
