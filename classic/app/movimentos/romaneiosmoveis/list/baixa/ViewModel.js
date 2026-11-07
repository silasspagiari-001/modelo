Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.baixa.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosmoveisbaixa',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideBaixar: false
        });
    }
});
