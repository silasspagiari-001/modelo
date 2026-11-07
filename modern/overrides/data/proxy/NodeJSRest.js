Ext.define('Ext.data.proxy.NodeJSRest', {
    extend: 'Ext.data.proxy.Rest',

    alias : 'proxy.nodejsrest',

    /*
     * Override:
     * Allow caching
     */
    noCache: false,
    timeout: 60000,

    /*
     * Override:
     * Declaring default URL reader and writer
     */
    reader: {
        type: 'json',
        rootProperty: 'results',
        totalProperty: 'total'
    },

    writer : {
        type : 'json'
    },

    getHeaders: function () {
        var headers = this.callParent(arguments) || {};

        Object.assign(headers, { 
            'x-access-token'  : localStorage.getItem(Object.keys(Ext.app.namespaces)[1] + 'UserToken'),
            'x-timezone'      : configs.getTimezone()      || 'America/Sao_Paulo',
            'x-empresa-logada': configs.getEmpresa().id    || 0,
            'x-client'        : configs.getClientName()    || '',
            'x-usuario-id'    : configs.getUsuario().id    || 0,
            'x-usuario-nome'  : configs.getUsuario().nome  || '',
            'x-usuario-login' : configs.getUsuario().login || ''
        });

        return headers;
    }
});
