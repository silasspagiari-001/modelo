Ext.define('SamosAdmin.processos.baixarorcamentos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',              
    alias: 'viewmodel.baixarorcamentos',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueProduto : '',
            valueInicio  : momentServer().subtract(1, 'years').format('YYYY-MM-DD')
        });

    }
}); 
