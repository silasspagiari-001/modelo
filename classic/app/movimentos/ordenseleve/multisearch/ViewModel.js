Ext.define('SamosAdmin.movimentos.ordenseleve.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.ordenselevemultisearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
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