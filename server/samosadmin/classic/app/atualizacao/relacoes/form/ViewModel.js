Ext.define('SamosAdmin.atualizacao.relacoes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formrelacoes',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating')
            },
        });
    },

    stores: {
        produtos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.atualizacao.relacoes.ModelItens',
            autoLoad: true,
            data: '{model.RELACOES_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
