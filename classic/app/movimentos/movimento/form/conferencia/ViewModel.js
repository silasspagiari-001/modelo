Ext.define('SamosAdmin.movimentos.movimento.form.conferencia.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.formmovimentosconferencia',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueBarras: '',
            valueQtde: 1,
            hideLiberar: false
        });
    }
});
