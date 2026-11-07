Ext.define('SamosAdmin.movimentos.notaservicos.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSSERVICOS_ID',
    idParent: 'ORDENSSERVICOS_ID_ORDENS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENSSERVICOS_QUANTIDADE'    : 0,
            'ORDENSSERVICOS_DESCONTOS'     : 0,
            'ORDENSSERVICOS_PERCENTUAL'    : 0,
            'ORDENSSERVICOS_BASEISS'       : 0,
            'ORDENSSERVICOS_VALORISS'      : 0,
            'ORDENSSERVICOS_BASEIRRF'      : 0,
            'ORDENSSERVICOS_VALORIRRF'     : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENSSERVICOS_ID',
        'ORDENSSERVICOS_ID_ORDENS',
        {
            name: 'ORDENSSERVICOS_ID_SERVICOS',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENSSERVICOS_QUANTIDADE',
        {
            name: 'ORDENSSERVICOS_PRECO',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENSSERVICOS_DESCONTOS',       // NUMERIC(12,2)
        'ORDENSSERVICOS_PERCENTUAL',       // NUMERIC(12,2)
        'TOTAL_LIQUIDO',
        'VALOR_LIQUIDO',
        'ORDENSSERVICOS_TOTAL',           // NUMERIC(12,2)
        {
            name: 'ORDENSSERVICOS_BASEISS',  // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_VALORISS', // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },        

    ]
});
