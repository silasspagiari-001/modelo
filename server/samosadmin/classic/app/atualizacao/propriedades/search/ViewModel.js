Ext.define('SamosAdmin.atualizacao.propriedades.search.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.propriedadessearch',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideSelecionar: function (get) {
                return false;
            },

            hideSair: function (get) {
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
