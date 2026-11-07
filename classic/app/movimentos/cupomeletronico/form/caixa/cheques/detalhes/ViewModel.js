Ext.define('SamosAdmin.movimentos.cupomeletronico.form.caixa.cheques.detalhes.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formcupomeletronicocaixachequesdetalhes',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideConfirmar: function(get) {
                return !get('hideAlterar');
            }
        });
    }
});
