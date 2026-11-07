Ext.define('SamosAdminModern.produtos.form.fotos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRODUTOSFOTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/produtosfotos'
    },
    
    fields: [
        'PRODUTOSFOTOS_ID',
        'PRODUTOSFOTOS_ID_PESSOAS',
        'PRODUTOSFOTOS_CAMINHO',
        'PRODUTOSFOTOS_EXTENSAO',
        'PRODUTOSFOTOS_DESCRICAO',
        'PRODUTOSFOTOS_LOG'
    ]
});
