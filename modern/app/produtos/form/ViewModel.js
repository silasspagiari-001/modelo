Ext.define('SamosAdminModern.produtos.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.produtosform',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            promocao: function(get) {
                return get('model.PROMOCOES')[0]
            },

            hidePromocao: function(get) {
                return (get('model.PROMOCOES')[0] || []).length == 0;
            },

            valorPromocao: function(get) {
                return Ext.util.Format.currency(get('promocao.PROMOCOESITENS_VALOR'));
            },

            valorCartao: function(get) {
                return Ext.util.Format.currency(get('promocao.PROMOCOESITENS_VALORB'));
            },

            valorDesconto: function(get) {
                return Ext.util.Format.currency(get('promocao.DESCONTO_CALCULADO'));
            },

            valorParcela: function (get) {
                return Ext.util.Format.currency(
                    get('promocao.TOTALPARCELAS_ITENS') / get('promocao.PROMOCOESITENS_PARCELAS')
                );
            }
        })
        
        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.produtos.ModelSaldos',
                autoLoad: true,
                data: '{model.SALDOS}',
                proxy: {
                    type: 'memory'
                }
            }
        })
    }
});
