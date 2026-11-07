Ext.define('SamosAdmin.movimentos.ordensacomtf.form.caixa.cartoes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordensacomtfcaixaformcartoes',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFaturado');
            },

            hideConfirmar: function(get) {
                return get('hideFechar');
            },

            isFaturado: function(get) {
                return get('movimento.ORDENS_STATUS') == 'F';
            }
        });
    }
});
