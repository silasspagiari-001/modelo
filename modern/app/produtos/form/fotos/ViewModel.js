Ext.define('SamosAdminModern.produtos.form.fotos.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.produtosfotos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            idProduto: 0
        })

        this.setFormulas({
            
        })
        
        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.produtos.form.fotos.Model',
                autoLoad: true,
                data: [],
                proxy: {
                    type: 'nodejsrest',
                    url: 'server/produtosfotos',
                    extraParams: {
                        idProduto: '{idProduto}'
                    }
                }
            }
        })
    }
});
