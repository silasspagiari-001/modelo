Ext.define('SamosAdmin.atualizacao.cargas.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.cargassearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: 0,
            valueStatus: 5 // Todos
        });
    }


});