Ext.define('SamosAdmin.movimentos.telemarketing.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formtelemarketing',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
           hideNovo: function(get) {
                return this.getView().getPermissoes().lockNovo;
            },

            hideSair: function(get) {
                return false;
            }
        });
    },

    stores: {
        main: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.telemarketing.Model',
            autoLoad: true,
            data: '{model.TELEMARKETING_LANCAMENTOS}',
            proxy: {
                type: 'memory'
            }
        }
    }
});
