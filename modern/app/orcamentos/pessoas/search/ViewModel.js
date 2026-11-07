Ext.define('SamosAdminModern.orcamentos.pessoas.search.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.orcamentospessoassearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: ''
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.pessoas.Model',
                proxy: {
                    url: 'server/pessoas'
                }
            }
        })
    }
});
