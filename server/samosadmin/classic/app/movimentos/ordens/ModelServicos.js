Ext.define('SamosAdmin.movimentos.ordens.ModelServicos', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSSERVICOS_ID',
    idParent: 'ORDENSSERVICOS_ID_ORDENS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENSSERVICOS_QUANTIDADE' : 0,
            'ORDENSSERVICOS_PRECO'      : 0,
            'ORDENSSERVICOS_PERCENTUAL' : 0,
            'ORDENSSERVICOS_DESCONTOS'  : 0,
            'ORDENSSERVICOS_TOTAL'      : 0,
            'ORDENSSERVICOS_ISS'        : 0,
            'ORDENSSERVICOS_BASEISS'    : 0,
            'ORDENSSERVICOS_VALORISS'   : 0,
            'ORDENSSERVICOS_IRRF'       : 0,
            'ORDENSSERVICOS_BASEIRRF'   : 0,
            'ORDENSSERVICOS_VALORIRRF'  : 0,
            'ORDENSSERVICOS_DESPESAS'   : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENSSERVICOS_ID',
        'ORDENSSERVICOS_ID_ORDENS',
        {
            name: 'ORDENSSERVICOS_ID_SERVICOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'SERVICOS_NOME',
        'ORDENSSERVICOS_DESCRITIVO',
        {
            name: 'ORDENSSERVICOS_QUANTIDADE',
            validators: [
                {type: 'range', min: 1, allowBlank: false}
            ]
        },
        {
            name: 'ORDENSSERVICOS_PRECO',
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENSSERVICOS_DESCONTOS',
        'ORDENSSERVICOS_PERCENTUAL',
        'ORDENSSERVICOS_TOTAL',
        {
            name: 'ORDENSSERVICOS_ISS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_BASEISS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_VALORISS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_IRRF',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_BASEIRRF',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_VALORIRRF',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENSSERVICOS_DESPESAS',      // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});
