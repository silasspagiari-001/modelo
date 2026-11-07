Ext.define('SamosAdmin.consultas.comprasvendaspessoa.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.comprasvendaspessoa',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valuePessoa : '',
            valueProduto: '',
            valueInicio : momentServer().startOf('year').format('DD/MM/YYYY'),
            totalGeral  : '0,00'
        });
    }
}); 
