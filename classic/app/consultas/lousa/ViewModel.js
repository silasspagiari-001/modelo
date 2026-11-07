Ext.define('SamosAdmin.consultas.lousa.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.lousa',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideLimparLousa: function(get){ return false },
            hideImprimir: function(get){ return false },
            hideSair     : function(get){ return false },
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.movimento.ModelItens',
//          autoLoad: true,
            data: '{model.MOVIMENTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
