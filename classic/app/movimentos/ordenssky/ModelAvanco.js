Ext.define('SamosAdmin.movimentos.ordenssky.ModelAvanco', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRODUTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordenssky/avanco'
    },

    constructor: function () {
        this.defaultValues = {
            'PRODUTOS_NOME': ''
        };

        this.callParent(arguments);
    },

    fields: [
        'PRODUTOS_ID',
        'PRODUTOS_NOME',
        'SALDO_MASTER',
        'SALDO_TECNICO',
        'QTDE_AVANCAR'
    ]
});
