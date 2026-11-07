Ext.define('SamosAdmin.movimentos.caixa.form.cartoes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formcaixaformcartoes',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFechado');
            },

            hideConfirmar: function(get) {
                return get('hideFechar');
            },

            isFechado: function(get) {
                return get('caixa.MOVIMENTOSCAIXA_STATUS') == 'F';
            }
        });
    }
});
