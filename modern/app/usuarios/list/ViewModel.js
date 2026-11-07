Ext.define('SamosAdminModern.usuarios.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.usuarios',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: ''
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.usuarios.Model',
                proxy: {
                    url: 'server/usuarios'
                }
            }
        })
    }
});
