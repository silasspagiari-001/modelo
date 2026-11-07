Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.baixa.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosindustriabaixa',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideBaixar: false
        });
    }
});
