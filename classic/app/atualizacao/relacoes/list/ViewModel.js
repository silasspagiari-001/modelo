Ext.define('SamosAdmin.atualizacao.relacoes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relacoes',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueStatus: 3
        });
    }
});
