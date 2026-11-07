Ext.define('SamosAdmin.movimentos.movimento.form.compraspessoa.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel', 
    alias: 'viewmodel.formmovimentoscompraspessoa',

    constructor: function () {
        this.callParent(arguments); 

        this.setStores({
            main: {
                type: 'nodejsstore',
                data: '{dataComprasPessoa}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});