Ext.define('SamosAdmin.movimentos.movimento.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.movimentosmultisearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: configs.getEmpresa().regimeCaixa ? 5 : 6,
            hideImportar: false
        });

        this.setFormulas({
            disableImportar: function (get) { 
                return false;
            }
        });
    }
});
