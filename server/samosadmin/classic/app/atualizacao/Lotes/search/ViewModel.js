Ext.define('SamosAdmin.atualizacao.lotes.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.lotessearch',

    constructor: function () {
        this.callParent(arguments);
        
        this.setData({
            valueProduto: '',
            valueIdProduto: '',
            valueOrdem: 2,
            valueStatus: 0,
            valueInicio: (configs.getProdutos().fabValInicial || momentServer().subtract(2, 'years').format('YYYY-MM-DD')),
            valueFinal:  momentServer().add(4, 'years').format('YYYY-MM-DD')            
        });

    }
});
