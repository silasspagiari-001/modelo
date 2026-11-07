Ext.define('SamosAdmin.consultas.pendenciasproduto.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.pendenciasproduto',

    constructor: function() { 
        this.callParent(arguments);

        this.setData({
            valueProduto: '',
            valueInicio : momentServer().subtract(1, 'year').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            },
            
            totalGeral: function (get) {
                get('forceTotais');
                
                const pendencias = this.getView().down('grid').getStore().getData().items || [];
                const total = pendencias.reduce((result, pendencia) => {
                    return result + cents(pendencia.get('TOTAL_LIQUIDO'));
                }, 0) / 100;

                return Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(total);
            }

        });
    }
}); 
