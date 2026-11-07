Ext.define('SamosAdminModern.receber.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.receber',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus    : '0',
            valueOrdem     : configs.getFinanceiros().boletos.ordemBusca,
            valuePessoa    : '',
            valueIdPessoa  : '',
            valuePortador  : configs.getPermissao()['DESCRICAO_PORTADORES'],
            valueIdPortador: configs.getPermissao()['EMPRESAS_ID_PORTADORES'],
            valueInicio    : momentServer().format('YYYY-MM-DD'),
            valueFinal     : momentServer().endOf('year').format('YYYY-MM-DD')
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.receber.Model',
                proxy: {
                    url: 'server/financeiros'
                }
            }
        })
    }
});
