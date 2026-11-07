Ext.define('SamosAdminModern.dashboard.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.dashboard',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().format('YYYY-MM-DD'),
            valueFinal : momentServer().format('YYYY-MM-DD')
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                fields: ['EMPRESAS_ID', 'EMPRESAS_FANTASIA', 'EMPRESAS_FATURAMENTO'],
                proxy: {
                    url: 'server/dashboard/faturamentoporempresa'
                }
            }
        })
    }
});
