Ext.define('SamosAdmin.movimentos.notaconsumidor.form.caixa.financeira.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formnotaconsumidorcaixafinanceira',

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
                const formMovimento = Ext.$('formnotaconsumidor')[0];
                const janelaCaixa = Ext.$('formnotaconsumidorcaixa')[0];
                
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
                return Ext.$('formnotaconsumidor')[0].getViewModel().get('isFaturado');
            }
        });
    }
});
