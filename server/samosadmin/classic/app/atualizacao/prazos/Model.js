Ext.define('SamosAdmin.atualizacao.prazos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRAZOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/prazos'
    },

    fields: [
        'PRAZOS_ID',//INTEGER NOT NULL
        {
            name: 'INTERVALO_DIAS',
            defaultValue: '30',
            validators: [
                {type: 'format', format: 'Números', matcher: /^\d+$/}
            ]
        },
        {
            name: "PRAZOS_STATUS",//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: "PRAZOS_NOME",//  VARCHAR(50),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        'PRAZOS_ACRESCIMO',//FLOAT
        'PRAZOS_DESCONTO',//FLOAT
        {
            name: "PRAZOS_PARCELAS",
            validators: [
                {type: 'range', min: 1}
            ]
        },
        {
            name: "PRAZOS_PARCELAMENTO",//  VARCHAR(50),
            validators: [
                {type: 'length', max: 512},
                {type: 'format', format: 'Números e #', matcher: /^[0-9?=.*#*]+$/}
            ]
        }
    ]
});
