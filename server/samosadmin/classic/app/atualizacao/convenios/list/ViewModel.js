Ext.define('SamosAdmin.atualizacao.convenios.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.convenios',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }

});
