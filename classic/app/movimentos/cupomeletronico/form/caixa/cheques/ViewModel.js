Ext.define('SamosAdmin.movimentos.cupomeletronico.form.caixa.cheques.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formcupomeletronicocaixacheques',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFaturado');
            },

            hideConfirmar: function (get) {
                return get('readOnly') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const janelaCaixa = Ext.$('formcupomeletronicocaixa')[0];
                
                return get('readOnly') ||
                       get('movimento').isNew() ||
                       !janelaCaixa.getViewModel().get('readOnly');
            },

            isFaturado: function(get) {
                return get('movimento.MOVIMENTOS_STATUS') == 'F';
            }
        });
    }
});
