Ext.define('SamosAdmin.movimentos.notaconsumidor.form.caixa.cheques.detalhes.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formnotaconsumidorcaixachequesdetalhes',

    constructor: function() {
        this.callParent(arguments);
        
        this.setFormulas({
            hideConfirmar: function(get) {
                return !get('hideAlterar');
            }
        });
    }
});
