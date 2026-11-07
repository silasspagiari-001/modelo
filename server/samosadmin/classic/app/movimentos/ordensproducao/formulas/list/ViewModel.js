Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.ordensproducaoformulas',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueOrdem : 2,
            valueStatus: 2
        });
    }
});
