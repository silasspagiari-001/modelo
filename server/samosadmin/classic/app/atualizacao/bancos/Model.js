Ext.define('SamosAdmin.atualizacao.bancos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'BANCOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/bancos'
    },

    fields: [
        'BANCOS_ID',//INTEGER NOT NULL
        {
            name: 'BANCOS_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'BANCOS_NOME',//  VARCHAR(20),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        }
    ]
});
