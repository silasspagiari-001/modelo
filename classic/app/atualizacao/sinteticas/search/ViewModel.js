Ext.define('SamosAdmin.atualizacao.sinteticas.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.sinteticassearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueRazao: 1,
            valueTipo: 0
        });
    }
});
