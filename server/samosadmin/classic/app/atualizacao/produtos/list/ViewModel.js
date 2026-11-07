Ext.define('SamosAdmin.atualizacao.produtos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.produtos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: configs.getProdutos().ordemBusca,
            valueStatus: configs.getProdutos().statusConsultaPreco
        });

        this.setFormulas({
            nomeProduto: function(get) {
                const nomeDoProduto = configs.getClientName() == 'stilomoveis' ?
                                     get('gridprodutos.selection.PRODUTOS_NOME') + ' ' +
                                     get('gridprodutos.selection.PRODUTOS_APLICACAO') : '';
                return `${nomeDoProduto}`;
            }
        })
    }
});
