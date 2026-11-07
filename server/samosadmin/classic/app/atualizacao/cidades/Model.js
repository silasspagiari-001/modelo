Ext.define('SamosAdmin.atualizacao.cidades.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CIDADES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/cidades'
    },

    fields: [
        'CIDADES_ID',
        'CIDADES_STATUS',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'CIDADES_IBGE'
    ]
});
