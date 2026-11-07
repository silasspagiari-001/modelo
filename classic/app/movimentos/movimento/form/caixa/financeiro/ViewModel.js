Ext.define('SamosAdmin.movimentos.movimento.form.caixa.financeiro.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formmovimentoscaixafinanceiro',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || 
                       (get('isFaturado') && !get('isNotaEntrada'));
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

            hideConfirmar: function (get) {
                return get('readOnly') || !get('hideAlterar') || !get('hideGravar');
            },

            isFaturado: function (get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isFaturado');
            },

            isNotaEntrada: function (get) {
                return Ext.$('formmovimentos')[0].getViewModel().get('isNotaEntrada');
            },

            isPagar: function (get) {
                return !Ext.$('formmovimentos')[0].getViewModel().get('isOperacaoSaida');
            },

            disablePortador: function (get) {

                const formMovimento = Ext.$('formmovimentos')[0];
                const modelMovimento = formMovimento.getViewModel().get('model');
                const titulos = modelMovimento.get('MOVIMENTOS_FINANCEIROS');

                return titulos && titulos.some(titulo => titulo['FINANCEIROS_NOSSONUMERO'] != 0)

            }

        });
    }
});
