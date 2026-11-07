Ext.define('SamosAdmin.movimentos.coletas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formcoletas',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
           hideNovo: function(get) {
                return this.getView().getPermissoes().lockNovo;
            },

            hideFotos: function (get) {
                return get('updating') 
            },

            hideSair: function(get) {
                return false;
            }
        });
    },
/*
    stores: {
        main: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.coletas.Model',
            autoLoad: true,
            data: '{model.TELEMARKETING_LANCAMENTOS}',
            proxy: {
                type: 'memory'
            }
        }
    }*/
});
