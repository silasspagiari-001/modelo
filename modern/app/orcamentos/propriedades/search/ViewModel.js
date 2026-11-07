Ext.define('SamosAdminModern.orcamentos.propriedades.search.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.orcamentospropriedadessearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: ''
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.propriedades.Model',
                proxy: {
                    url: 'server/propriedades'
                }
            }
        })
    }
});
