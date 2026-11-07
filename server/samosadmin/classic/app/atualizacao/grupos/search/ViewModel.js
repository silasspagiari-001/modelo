Ext.define('SamosAdmin.atualizacao.grupos.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.grupossearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0
        });
    }    

});
