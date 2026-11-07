Ext.define('SamosAdmin.movimentos.ordens.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.ordensmultisearch',

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