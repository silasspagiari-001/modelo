Ext.define('SamosAdmin.relatorios.vendaspessoaprodutos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendaspessoaprodutoslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir   : false,
            valueInicio    : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal     : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdUsuarioi: 1,
            valueIdUsuariof: 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueIdProdutoi: 1,
            valueIdProdutof: 999999,
            valueIdPessoai : 1,
            valueIdPessoaf : 999999,
            valueDocumento : '3',
            valueVacina    : '2',
            valuePRP       : '2'
        });
    }
});
