Ext.define('SamosAdminModern.login.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.login',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            unlogged: true
        });

        this.setFormulas({
            disableEntrar: function(get) {
                return !get('selectedEmpresa');
            },
            logged: function(get){
                return !get('unlogged');
            }
        });

        this.setStores({
            permissoes: {
                type: 'nodejsstore',
                proxy: {
                    url: 'server/permissoes'
                }
            }
        });
    }
});
