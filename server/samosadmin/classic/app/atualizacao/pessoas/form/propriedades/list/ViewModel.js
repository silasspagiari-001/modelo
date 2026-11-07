Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.list.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.propriedades',

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
            model: 'SamosAdmin.atualizacao.pessoas.form.propriedades.Model',
            autoLoad: true,
            data: '{model.PESSOAS_PROPRIEDADES}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
