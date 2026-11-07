Ext.define('SamosAdmin.atualizacao.custos.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.custossearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0
        });
    }


});