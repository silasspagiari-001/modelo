Ext.define('SamosAdmin.movimentos.romaneiosindustria.form.baixar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formromaneiosindustriabaixar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
