Ext.define('SamosAdmin.movimentos.ordensveiculos.fotos.preview.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.previewfotoordensveiculos',

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
    }
});
