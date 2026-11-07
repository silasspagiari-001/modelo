Ext.define('SamosAdmin.movimentos.ordensveiculos.form.baixar.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formordensveiculosbaixar',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
