Ext.define('SamosAdminModern.pedidos.conferencia.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.pedidosconferencia',

    constructor: function () {
        this.callParent(arguments);
        
        this.setData({
            valueBarras: '',
            hideLiberar: false
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.pedidos.ModelItens',
                proxy: {
                    type: 'memory'
                }
            }
        })
    }
});
