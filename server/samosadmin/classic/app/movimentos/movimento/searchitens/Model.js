Ext.define('SamosAdmin.movimentos.movimento.searchitens.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/movimentositens'
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSITENS_QUANTIDADE': 0,
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSITENS_ID',                         // INTEGER NOT NULL
        {
            name: 'MOVIMENTOSITENS_ID_PRODUTOS',      // INTEGER NOT NULL
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUTOS_STATUS',
        'PRODUTOS_NOME',
        {
            name: 'MOVIMENTOSITENS_QUANTIDADE',       // NUMERIC(12,2)
            validators: [
                {type: 'range', min: 0.001, allowBlank: false}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_ENTREGUE',       // NUMERIC(12,2)
            validators: [
                {type: 'range', min: 0.001, allowBlank: false}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_DEPOSITO',       // NUMERIC(12,2)
            validators: [
                {type: 'range', min: 0.001, allowBlank: false}
            ]
        },
        {
            name: 'ITENS_ENTREGAR',       // NUMERIC(12,2)
            validators: [
                {type: 'range', min: 0.001, allowBlank: false}
            ]
        }
    ]
});
