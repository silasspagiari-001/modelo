Ext.define('SamosAdmin.movimentos.ordensfumya.form.baixar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formordensfumyabaixar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
