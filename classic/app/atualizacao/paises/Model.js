Ext.define('SamosAdmin.atualizacao.paises.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PAISES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/paises'
    },

    fields: [
        'PAISES_ID',     // Integer
        {
            name: 'PAISES_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        'PAISES_CODIGO',  // Integer
        'PAISES_NOME'   // VARCHAR
    ]
});
