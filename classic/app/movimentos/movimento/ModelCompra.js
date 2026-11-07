Ext.define('SamosAdmin.movimentos.movimento.ModelCompra', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSFINANCEIROSCOMPRA_ID',
    idParent: 'MOVIMENTOSFINANCEIROSCOMPRA_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    fields: [
        'MOVIMENTOSFINANCEIROSCOMPRA_ID',
        'MOVIMENTOSFINANCEIROSCOMPRA_ID_MOVIMENTOS',
        {
            name: 'MOVIMENTOSFINANCEIROSCOMPRA_VCTO',
            type: 'nodejsdate',
            defaultValue: '1899-12-30',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSFINANCEIROSCOMPRA_VALOR',
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});
