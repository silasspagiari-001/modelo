Ext.define('SamosAdmin.relatorios.vendasintetica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendasinteticalist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa: '',
            valueEmpresa: '',
            valueIdProdutoi: 1,
            valueIdProdutof: 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueIdUsuarioi: 1,
            valueIdUsuariof: 999999,
            valueInicio    : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal     : momentServer().format('YYYY-MM-DD'),
            valueDocumento : 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
