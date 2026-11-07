Ext.define('SamosAdmin.movimentos.notaconsumidor.form.debitospessoa.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel', 
    alias: 'viewmodel.formnotaconsumidordebitospessoa',

    constructor: function () {
        this.callParent(arguments); 

        this.setFormulas({
            hideLiberar: function(get) {
                return false;
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                data: '{dataDebitosPessoa}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});
