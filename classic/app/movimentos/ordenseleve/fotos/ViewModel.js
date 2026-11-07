Ext.define('SamosAdmin.movimentos.ordenseleve.fotos.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.fotosordenseleve',

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
            model: 'SamosAdmin.movimentos.ordenseleve.fotos.Model',
            autoLoad: false,
            data: [],
            proxy: {
                type: 'memory'
            }
        }
    }
});
