Ext.define('SamosAdmin.dashboard.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.samosdashboard',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().format('YYYY-MM-DD'),
            valueFinal : momentServer().format('YYYY-MM-DD')
        });
    },

    stores: {
        faturamento: {
            type: 'nodejsstore',
            fields: ['EMPRESAS_ID', 'EMPRESAS_FANTASIA', 'EMPRESAS_FATURAMENTO'],
            proxy: {
                url: 'server/dashboard/faturamentoporempresa'
            }
        }
    }
});
