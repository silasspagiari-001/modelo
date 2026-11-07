Ext.define('SamosAdmin.relatorios.vendasfornecedorsintetica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendasfornecedorsinteticalist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir   : false,
            valueInicio    : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal     : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdPessoai : 1,
            valueIdPessoaf : 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueOrdem     : '1',
            valuePreco     : '1',
            valueBonificacao: '2'
        });
    }
});
