Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.baixa.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.romaneiosmoveisbaixaform',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideSair: false,
            hideBaixar: false
        });
    }
});
