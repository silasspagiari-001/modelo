Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.baixar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formordenscirurcenterbaixar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
