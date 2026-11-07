Ext.define('SamosAdmin.atualizacao.sinteticas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.sinteticas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueTipo: 0
        });

    }

});
