Ext.define('SamosAdminModern.orcamentos.produtos.search.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.orcamentosprodutossearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: ''
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.produtos.Model',
                proxy: {
                    url: 'server/produtos'
                }
            }
        })
    }
});
