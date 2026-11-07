Ext.define('SamosAdminModern.propriedades.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.propriedades',

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
