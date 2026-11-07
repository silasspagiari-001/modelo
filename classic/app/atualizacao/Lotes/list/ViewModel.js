Ext.define('SamosAdmin.atualizacao.lotes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.lotes',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

        this.setData({
            valueOrdem: 2,
            valueStatus: 0,
            valueInicio: (configs.getProdutos().fabValInicial || momentServer().subtract(1, 'year').format('YYYY-MM-DD')),
            valueFinal:  momentServer().add(1, 'year').format('YYYY-MM-DD')
        });

    }

});
