Ext.define('SamosAdmin.relatorios.baixas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosbaixaslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir     : false,
            valueInicio      : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal       : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueFinanceiro  : 1,
            valueIdUsuarioi  : 1,
            valueIdUsuariof  : 999999,
            valueIdPortadori : 1,
            valueIdPortadorf : 999999,
            valueQuebra     : '1'
        });
    }
});
