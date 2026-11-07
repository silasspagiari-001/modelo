Ext.define('SamosAdmin.atualizacao.produtos.multisearch.ViewModel', {
    extend: 'SamosWidgets.multisearch.ViewModel',
    alias: 'viewmodel.produtosmultisearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: configs.getProdutos().statusConsultaPreco, //configs.getEmpresa().regimeCaixa ? 5 : 6,
            hideImportar: false
        });

        this.setFormulas({
            disableImportar: function (get) { 
                return false;
            }
        });
    }
});
