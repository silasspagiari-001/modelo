Ext.define('SamosAdmin.movimentos.notificacao.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.notificacao',
    
    constructor: function() {
        this.callParent(arguments);

        this.setData({ 
            valueStatus: 5 
        });
    }
});
