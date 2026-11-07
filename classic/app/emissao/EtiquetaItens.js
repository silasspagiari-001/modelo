Ext.define('SamosAdmin.emissao.EtiquetaItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ETIQUETASITENS_ID',
    idParent:   'ETIQUETASITENS_ID_ETIQUETAS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ETIQUETASITENS_QUANTIDADE': 1
        };
        
        this.callParent(arguments);
    },

    fields: [
        'ETIQUETASITENS_ID',
        'ETIQUETASITENS_ID_ETIQUETAS',
        'ETIQUETASITENS_ID_PESSOAS',
        'ETIQUETASITENS_ID_PRODUTOS',
        'ETIQUETASITENS_QUANTIDADE',
        'ETIQUETASITENS_MODELO',
        'ETIQUETASITENS_APLICACAO'
    ]
});
