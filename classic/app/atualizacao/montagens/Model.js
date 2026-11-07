Ext.define('SamosAdmin.atualizacao.montagens.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MONTAGENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/montagens'
    },

    fields: [
        'MONTAGENS_ID',
        {
            name: 'MONTAGENS_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'MONTAGENS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        'MONTAGENS_VALOR',
        {
            name: 'VALOR_MONTAGEMA',
            critical: true            
        },
        {
            name: 'VALOR_MONTAGEMB',
            critical: true            
        },
        {
            name: 'VALOR_MONTAGEMC',
            critical: true            
        }
    ]
});
