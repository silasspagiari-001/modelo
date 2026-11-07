Ext.define('SamosAdmin.processos.estoque.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.processosestoque',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueDiacalculo: momentServer().format('DD/MM/YYYY')
        }),

        this.setFormulas({
            hideAtualizar: function(get){ return false },
            hideSair     : function(get){ return false }
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.movimento.ModelItens',
            autoLoad: true,
            data: '{model.MOVIMENTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
