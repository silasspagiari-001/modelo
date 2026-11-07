Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.financeira.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formordenscirurcentercaixafinanceira',

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
                const formMovimento = Ext.$('formordenscirurcenter')[0];
                const janelaCaixa = Ext.$('formordenscirurcentercaixa')[0];
                
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
                return Ext.$('formordenscirurcenter')[0].getViewModel().get('isFaturado');
            }
        });
    }
});
