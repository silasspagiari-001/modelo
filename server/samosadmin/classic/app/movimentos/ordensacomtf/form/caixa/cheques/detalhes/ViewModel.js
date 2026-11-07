Ext.define('SamosAdmin.movimentos.ordensacomtf.form.caixa.cheques.detalhes.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordensacomtfcaixachequesdetalhes',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideConfirmar: function(get) {
                return !get('hideAlterar');
            }
        });
    }
});
