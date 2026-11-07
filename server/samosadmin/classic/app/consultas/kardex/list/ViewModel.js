Ext.define('SamosAdmin.consultas.kardex.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.kardex',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueProduto : '',
            valueInicio  : momentServer().subtract(1, 'years').format('YYYY-MM-DD')
        });

    }
}); 
