Ext.define('SamosAdmin.atualizacao.usuarios.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.usuariossearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0
        });
    }    

});
