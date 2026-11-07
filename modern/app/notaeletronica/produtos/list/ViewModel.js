Ext.define('SamosAdminModern.notaeletronica.produtos.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.notaeletronicaprodutos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            valorPreco: function(get) {
                return Ext.util.Format.currency(get('produto.MOVIMENTOSITENS_PRECO'));
            },
            
            valorPercentual: function(get) {
                return Ext.util.Format.currency(get('produto.MOVIMENTOSITENS_PERCENTUAL'));
            },
            
            valorDesconto: function(get) {
                return Ext.util.Format.currency(get('produto.MOVIMENTOSITENS_DESCONTOS'));
            },
            
            valorPrecoLiquido: function(get) {
                return Ext.util.Format.currency(get('produto.VALOR_LIQUIDO'));
            },
            
            valorTotalLiquido: function(get) {
                return Ext.util.Format.currency(get('produto.TOTAL_LIQUIDO'));
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
                model: 'SamosAdminModern.notaeletronica.ModelItens',
                autoLoad: true,
                data: '{model.MOVIMENTOS_ITENS}',
                proxy: {
                    type: 'memory'
                }
            }
        })
    }
});
