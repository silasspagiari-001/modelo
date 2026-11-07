Ext.define('SamosAdmin.movimentos.movimento.form.divergencias.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel', 
    alias: 'viewmodel.formmovimentosdivergencias',

    constructor: function () {
        this.callParent(arguments); 

        this.setStores({
            main: {
                type: 'nodejsstore',
                data: '{dataDivergencias}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});
