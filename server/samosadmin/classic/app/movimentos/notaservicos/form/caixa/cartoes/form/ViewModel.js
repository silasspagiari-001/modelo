Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.cartoes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formnotaservicoscaixaformcartoes',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFaturado');
            },

            hideConfirmar: function(get) {
                return get('hideGravar');
            },

            isFaturado: function(get) {
                return get('movimento.ORDENS_STATUS') == 'F';
            }
        });
    }
});
