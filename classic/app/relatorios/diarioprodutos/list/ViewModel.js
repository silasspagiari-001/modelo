Ext.define('SamosAdmin.relatorios.diarioprodutos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosdiarioprodutoslist',

    constructor: function () {
        this.callParent(arguments);
 
        this.setData({
            valueIdProdutoi: 1,
            valueIdProdutof: 999999,
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueInicio    : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal     : momentServer().format('YYYY-MM-DD'),
            valueTipo      : 0
        });

        this.setFormulas({
            totalFormatado: function (get) {
                get('forceTotais');
                
                const titulos = this.getView().down('grid').getStore().getData().items || [];
                const total = titulos.reduce((result, titulo) => {
                    return result + cents(titulo.get('FINANCEIROS_ORIGINAL'));
                }, 0) / 100;

                return Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(total);
            },

            hideImprimir: function (get) {
                return false;
            }
        });
    }    

});
