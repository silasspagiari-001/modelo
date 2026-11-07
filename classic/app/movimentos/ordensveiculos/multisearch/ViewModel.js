Ext.define('SamosAdmin.movimentos.ordensveiculos.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.ordensveiculosmultisearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio : momentServer().startOf('month').format('DD/MM/YYYY'), 
            valueOrdem: 0,           
            hideImportar: false
        });

        this.setFormulas({
            disableImportar: function (get) { 
                return false;
            }
        });
    }
});