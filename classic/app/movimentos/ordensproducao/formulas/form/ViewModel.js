Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordensproducaoformulas',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({

            hideImprimir: function(get) {
                return get('updating');
            }

        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordensproducao.formulas.ModelItens',
            autoLoad: true,
            data: '{model.PRODUCOESFORMULAS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
