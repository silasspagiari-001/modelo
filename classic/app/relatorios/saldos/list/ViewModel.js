Ext.define('SamosAdmin.relatorios.saldos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriossaldoslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valuePessoai   : '',
            valuePessoaf   : '',
            valueGrupoi    : '',
            valueGrupof    : '',
            valueIdPessoai : 1,
            valueIdPessoaf : 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueTipo      : 0,
            valuePreco     : 1,
            valueAuditoria : false,
            valueInicio    : momentServer().format('YYYY-MM-DD'),
            valueFinal     : momentServer().endOf('month').format('DD/MM/YYYY'),
            valueStatus    : configs.getProdutos().statusConsultaPreco
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
