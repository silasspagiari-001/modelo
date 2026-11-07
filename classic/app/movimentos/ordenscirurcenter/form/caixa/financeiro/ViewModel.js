Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.financeiro.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formordenscirurcentercaixafinanceiro',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || 
                       get('isFaturado');
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

            hideConfirmar: function (get) {
                return get('readOnly') || !get('hideAlterar') || !get('hideGravar');
            },

            isFaturado: function (get) {
                return Ext.$('formordenscirurcenter')[0].getViewModel().get('isFaturado');
            }
        });
    }
});
