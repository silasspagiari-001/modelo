Ext.define('SamosAdmin.atualizacao.grupos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'GRUPOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/grupos'
    },

    fields: [
        'GRUPOS_ID',//INTEGER NOT NULL
        {
            name: 'GRUPOS_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'GRUPOS_NOME',//  VARCHAR(50),
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        }
    ]
});
