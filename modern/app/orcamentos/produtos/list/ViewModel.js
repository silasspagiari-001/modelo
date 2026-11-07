Ext.define('SamosAdminModern.orcamentos.produtos.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.orcamentosprodutos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            valorPreco: function(get) {
                return Ext.util.Format.currency(get('produto.MOVIMENTOSITENS_PRECO'));
            },
            
            totalDesconto: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_DESCONTOS'));
            },
            
            totalProdutos: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_PRODUTOS'));
            },
            
            totalLiquido: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_TOTAL'));
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.orcamentos.ModelItens',
                autoLoad: true,
                data: '{model.MOVIMENTOS_ITENS}',
                proxy: {
                    type: 'memory'
                }
            }
        })
    }
});
