Ext.define('SamosAdmin.consultas.comprasvendasproduto.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.comprasvendasproduto',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir: false,
            valuePessoa : '',
            valueProduto: '',
            valueInicio : momentServer().startOf('year').format('YYYY-MM-DD'),
            totalGeral  : '0,00'
        });
    }
}); 
