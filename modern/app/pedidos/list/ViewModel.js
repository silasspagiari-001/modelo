Ext.define('SamosAdminModern.pedidos.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.pedidos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: '',
            valueStatus  : 6,
            valueOrdem   : 0,
            valueInicio  : momentServer().format('YYYY-MM-DD'),
            valueFinal   : momentServer().format('YYYY-MM-DD')
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.pedidos.Model',
                proxy: {
                    url: 'server/movimentos'
                }
            }
        })
    }
});
