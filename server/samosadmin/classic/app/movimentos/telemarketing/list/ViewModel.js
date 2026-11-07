Ext.define('SamosAdmin.movimentos.telemarketing.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.telemarketing',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            isOrdemNascimento: function(get) {
                return get('valueOrdem') == 3
            }            
        });

    } 
});
