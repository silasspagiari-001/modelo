Ext.define('SamosAdmin.atualizacao.custos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.custos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }

});