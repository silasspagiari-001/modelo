Ext.define('SamosAdmin.movimentos.movimento.form.caixa.financeira.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formmovimentoscaixafinanceira',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFaturado');
            },

            hideConfirmar: function (get) {
                return get('readOnly') || !get('hideAlterar') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                const janelaCaixa = Ext.$('formmovimentoscaixa')[0];
                
                return  get('readOnly') ||
                        (
                            !janelaCaixa && 
                            formMovimento.getViewModel().get('updating')
                        ) ||
                        (
                            !!janelaCaixa && 
                            !janelaCaixa.getViewModel().get('readOnly')
                        );
            },

            isFaturado: function (get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isFaturado');
            }
        });
    }
});
