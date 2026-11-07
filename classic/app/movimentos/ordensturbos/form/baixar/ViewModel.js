Ext.define('SamosAdmin.movimentos.ordensturbos.form.baixar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formordensturbosbaixar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
