Ext.define('SamosAdmin.movimentos.promocoes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formpromocoes',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideProdutos: function (get) {
                return get('readOnly');
            }
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.promocoes.ModelItens',
            autoLoad: true,
            data: '{model.PROMOCOES_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
