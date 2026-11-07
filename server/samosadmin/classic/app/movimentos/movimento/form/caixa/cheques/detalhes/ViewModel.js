Ext.define('SamosAdmin.movimentos.movimento.form.caixa.cheques.detalhes.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentoscaixachequesdetalhes',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideConfirmar: function(get) {
                return !get('hideAlterar');
            }
        });
    }
});
