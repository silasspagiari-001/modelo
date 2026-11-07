Ext.define('SamosAdmin.emissao.etiquetaspessoas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.emissaoetiquetaspessoas',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueStatus: 3
        });
    }
});
