Ext.define('SamosAdmin.consultas.comprasvendaslote.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.comprasvendaslote',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valuePessoa : '',
            valueLote   : '',
            valueInicio : momentServer().startOf('year').format('YYYY-MM-DD'),
            totalGeral  : '0,00'
        });
    }
}); 
