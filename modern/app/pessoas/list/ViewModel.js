Ext.define('SamosAdminModern.pessoas.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.pessoas',

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
