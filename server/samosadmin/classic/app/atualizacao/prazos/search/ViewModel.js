Ext.define('SamosAdmin.atualizacao.prazos.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.prazossearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0
        });
    }        

});
