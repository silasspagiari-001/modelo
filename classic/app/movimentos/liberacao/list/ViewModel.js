Ext.define('SamosAdmin.movimentos.liberacao.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.liberacao',
    
    constructor: function() {
        this.callParent(arguments);

        this.setData({ 
            valueStatus: 0 
        });
    }
});
