Ext.define('SamosAdmin.emissao.etiquetasprodutos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.emissaoetiquetas',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueStatus: 3
        });
    }
});
