Ext.define('SamosAdmin.movimentos.ordenseleve.ModelServicos', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSSERVICOS_ID',
    idParent: 'ORDENSSERVICOS_ID_ORDENS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENSSERVICOS_ID_USUARIOS': 0,
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
            'ORDENSSERVICOS_DESPESAS'   : 0,
            'ITEM_DATA'                 : momentServer().format('YYYY-MM-DD'),
            'ITEM_HORALOCAL'            : '00:00',
            'ITEM_HORAINICIO'           : '00:00',
            'ITEM_HORAFIM'              : '00:00',
            'ITEM_TEMPO'                : '00:00',
            'ITEM_PREVISTO'             : '00:00',            
            'ITEM_MINIMO'               : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENSSERVICOS_ID',
        'ORDENSSERVICOS_ID_ORDENS',
        'ORDENSSERVICOS_ID_USUARIOS',
        'USUARIOS_LOGIN',
        {
            name: 'ORDENSSERVICOS_ID_SERVICOS',
            validators: [
                {type: 'presence'}
            ]
        },
        'SERVICOS_NOME',
        'ORDENSSERVICOS_DESCRITIVO',
        {
            name: 'ITEM_DATA',
            type: 'nodejsdate',            
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ITEM_HORALOCAL',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ITEM_MINIMO',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ITEM_HORAINICIO',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ITEM_HORAFIM',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ITEM_TEMPO',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ITEM_PREVISTO',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },

        'ORDENSSERVICOS_QUANTIDADE',
        'ORDENSSERVICOS_PRECO',
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
