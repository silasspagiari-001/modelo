Ext.define('SamosAdmin.consultas.pendencias.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.pendencias',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valuePessoa : '',
            valueProduto: '',
            valueInicio : momentServer().subtract(1, 'year').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            },
            
            hideGerarPedido: function (get) {
                return false;
            },

            totalSelecionado: function (get) {
                get('forceTotais');
                
                const selection = this.getView().down('grid').getSelectionModel().getSelection() || [];
                const totalSelecionado = selection.reduce((result, pendencia) => {
                    return result + cents(pendencia.get('TOTAL_LIQUIDO'));
                }, 0) / 100;

                return Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(totalSelecionado);
                
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
