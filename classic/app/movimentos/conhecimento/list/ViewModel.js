Ext.define('SamosAdmin.movimentos.conhecimento.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.conhecimento',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().format('YYYY-MM-DD'),
            valueStatus: 2
        });
    }
});
