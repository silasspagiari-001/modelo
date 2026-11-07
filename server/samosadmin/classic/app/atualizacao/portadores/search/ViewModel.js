Ext.define('SamosAdmin.atualizacao.portadores.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.portadoressearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0
        });
    }
});
