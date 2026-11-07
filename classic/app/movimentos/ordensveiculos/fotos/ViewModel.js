Ext.define('SamosAdmin.movimentos.ordensveiculos.fotos.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.fotosordensveiculos',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({

            hideSair: function(get) {
                return false;
            },

            hideNova: function(get) {
                return false;
            },

            hideVisualizar: function(get) {
                return false;
            }

        });
    },

    stores: {

        fotos: {
            type: 'nodejsstore',
            model: 'SamosAdmin.movimentos.ordensveiculos.fotos.Model',
            autoLoad: false,
            data: [],
            proxy: {
                type: 'memory'
            }
        }
    }
});
