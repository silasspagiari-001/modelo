Ext.define('SamosAdmin.movimentos.ordenssky.form.detalhesavariados.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ordensskyformdetalhesavariados',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideSair: function(get) {
                return !get('readOnly');
            },

            hideCancelar: function(get) {
                return get('readOnly');
            },

            hideAlterar: function(get) {
                return !get('readOnly');
            },

            hideGravar: function(get) {
                return get('readOnly');
            }
        });
    }
});
