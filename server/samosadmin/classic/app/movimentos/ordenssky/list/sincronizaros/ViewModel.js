Ext.define('SamosAdmin.movimentos.ordenssky.list.sincronizaros.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ordensskyslistsincronizaros',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSincronizar: false,
            hideSair: false
        });
    }
});
