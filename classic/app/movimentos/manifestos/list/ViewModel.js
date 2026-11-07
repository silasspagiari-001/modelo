Ext.define('SamosAdmin.movimentos.manifestos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.manifestos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().format('YYYY-MM-DD'),
            valueStatus: 4
        });
    }
});
