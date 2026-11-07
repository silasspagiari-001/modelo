Ext.define('SamosAdmin.faleconosco.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.faleconoscoform',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideEnviar: false,
            hideCancelar: false
        });
    }
});
