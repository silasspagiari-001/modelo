Ext.define('SamosAdmin.relatorios.saldoscomparativo.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriossaldoscomparativolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueEmpresai: '',
            valueEmpresaf: '',
            valuePessoai: '',
            valuePessoaf: '',
            valueGrupoi: '',
            valueGrupof: '',
            valueIdEmpresai: 1,
            valueIdEmpresaf: 999,
            valueIdPessoai : 1,
            valueIdPessoaf : 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueInicio    : momentServer().format('YYYY-MM-DD'),
            valueFinal     : momentServer().endOf('month').format('DD/MM/YYYY'),
            valueStatus    : configs.getProdutos().statusConsultaPreco,
            valuePreco     : 0            
        })

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
