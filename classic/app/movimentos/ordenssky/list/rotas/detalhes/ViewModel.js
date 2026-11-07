Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.detalhes.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ordensskyrotasdetalhes',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideCancelar: function(get) {
                return get('readOnly');
            },

            hideGravar: function(get) {
                return get('readOnly');
            }
        });
    }
});
