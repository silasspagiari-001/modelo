Ext.define('SamosAdmin.atualizacao.permissoes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PERMISSOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/permissoes'
    },

    constructor: function () {
        this.defaultValues = {
            'PERMISSOES_ID': 0
        };

        this.callParent(arguments);
    },

    fields: [
        "PERMISSOES_ID",         // Integer
        "PERMISSOES_ID_EMPRESAS", // Integer
        "PERMISSOES_ID_USUARIOS", // Integer
        {
            name:  "PERMISSOES_ITENS",       // blob
            critical: true
        }
    ]
});
