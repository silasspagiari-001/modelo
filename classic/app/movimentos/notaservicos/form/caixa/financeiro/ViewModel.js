Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.financeiro.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formnotaservicoscaixafinanceiro',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFaturado');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formnotaservicos')[0];
                const janelaCaixa   = Ext.$('formnotaservicoscaixa')[0];
                
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
                return Ext.$('formnotaservicos')[0].getViewModel().get('isFaturado');
            }
        });
    }
});
