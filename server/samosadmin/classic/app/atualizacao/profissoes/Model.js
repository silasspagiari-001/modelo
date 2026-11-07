Ext.define('SamosAdmin.atualizacao.profissoes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PROFISSOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/profissoes'
    },

    fields: [
        'PROFISSOES_ID',                 // Integer
        {
            name: 'PROFISSOES_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PROFISSOES_NOME',     // VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        }
    ]
});
