Ext.define('SamosAdmin.atualizacao.convenios.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CONVENIOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/convenios'
    },

    fields: [
        'CONVENIOS_ID',
        {
            name: 'CONVENIOS_STATUS', //  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'CONVENIOS_TIPO', // char(1) L/O/A
            validators: [
                {type: 'presence'}
            ]
        },        
        {
            name: 'CONVENIOS_SIGLA',//  VARCHAR(2)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'CONVENIOS_NOME',//  VARCHAR(256)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 256}
            ]
        }
    ]
});
