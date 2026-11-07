Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'FORMULASITENS_ID',
    idParent:   'FORMULASITENS_ID_FORMULAS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'FORMULASITENS_QUANTIDADE': 1,
            'FORMULASITENS_PERCENTUAL': 'F'
        };
        
        this.callParent(arguments);
    },

    fields: [
        'FORMULASITENS_ID',
        'FORMULASITENS_ID_FORMULAS',
        'FORMULASITENS_ID_PRODUTOS',
        'FORMULASITENS_QUANTIDADE',
        'FORMULASITENS_PERCENTUAL'
    ]
});
