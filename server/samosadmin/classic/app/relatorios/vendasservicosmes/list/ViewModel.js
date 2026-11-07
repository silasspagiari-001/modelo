Ext.define('SamosAdmin.relatorios.vendasservicosmes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendasservicosmeslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir    : false,
            valueInicio     : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal      : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdPessoai  : 0
        })
    }
});
