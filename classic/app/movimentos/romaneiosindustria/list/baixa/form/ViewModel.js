Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.baixa.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.romaneiosindustriabaixaform',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
