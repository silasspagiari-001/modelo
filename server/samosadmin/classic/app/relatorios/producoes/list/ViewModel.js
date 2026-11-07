Ext.define('SamosAdmin.relatorios.producoes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosproducoeslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa: '',
            valueEmpresa: '',
            valueIdProdutoi: 1,
            valueIdProdutof: 999999,
            valueInicio    : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal     : momentServer().format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
