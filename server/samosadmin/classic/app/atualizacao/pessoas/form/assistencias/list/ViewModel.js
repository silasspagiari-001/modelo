Ext.define('SamosAdmin.atualizacao.pessoas.form.assistencias.list.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.assistencias',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideNovo: function(get) {
                return false;
            },

            hideSair: function(get) {
                return false;
            }
        });
    },

    stores: {
        main: {
            type: 'nodejsstore',
            model: 'SamosAdmin.atualizacao.pessoas.form.assistencias.Model',
            autoLoad: true,
            data: '{model.PESSOAS_ASSISTENCIAS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
