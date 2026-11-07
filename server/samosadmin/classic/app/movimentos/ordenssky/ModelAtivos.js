Ext.define('SamosAdmin.movimentos.ordenssky.ModelAtivos', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENSATIVOS_ID',
    idParent: 'ORDENSATIVOS_ID_ORDENS',

    proxy: {
        type: 'nodejsrest'
    },

    fields: [
        'ORDENSATIVOS_ID',
        'ORDENSATIVOS_ID_ORDENS',
        {
            name: 'ORDENSATIVOS_REFERENCIA', 
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'ORDENSATIVOS_DESCRICAO', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENSATIVOS_SERIAL', 
            validators: [
                {type: 'length', max: 20}
            ]
        },
        {
            name: 'ORDENSATIVOS_CARTAO', 
            validators: [
                {type: 'length', max: 20}
            ]
        }
    ]
});
