Ext.define('SamosAdmin.movimentos.coletas.form.fotos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'COLETASFOTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/coletasfotos'
    },

    // Adicionando campos        
    
    fields: [
        'COLETASFOTOS_ID',
        'COLETASFOTOS_ID_PESSOAS',
        'COLETASFOTOS_EXTENSAO',
        'COLETASFOTOS_CAMINHO',
        'COLETASFOTOS_DESCRICAO',
        'COLETASFOTOS_LOG'
    ]
});
