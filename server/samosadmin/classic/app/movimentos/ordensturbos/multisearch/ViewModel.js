Ext.define('SamosAdmin.movimentos.ordensturbos.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.ordensturbosmultisearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio : momentServer().startOf('month').format('DD/MM/YYYY'), 
            valueOrdem: 3,           
            hideImportar: false
        });

        this.setFormulas({
            disableImportar: function (get) { 
                return false;
            }
        });
    }
});