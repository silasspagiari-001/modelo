Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.cheques.detalhes.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordenscirurcentercaixachequesdetalhes',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideConfirmar: function(get) {
                return !get('hideAlterar');
            }
        });
    }
});
