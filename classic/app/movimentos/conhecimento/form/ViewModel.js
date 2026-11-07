Ext.define('SamosAdmin.movimentos.conhecimento.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formconhecimento',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            isCancelado: function(get) {
                return get('model.CONHECIMENTOS_STATUS') == 'C';
            },

            hideSefaz: function (get) {
                return get('updating');
            },

            hasProtocolo: function(get) {
                return !!get('model.CONHECIMENTOS_PROTOCOLO');
            }
        });
    },

    stores: {
        notas: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.conhecimento.ModelItens',
            autoLoad: true,
            data: '{model.CONHECIMENTOS_ITENS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
