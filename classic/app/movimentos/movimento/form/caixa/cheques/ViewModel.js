Ext.define('SamosAdmin.movimentos.movimento.form.caixa.cheques.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formmovimentoscaixacheques',

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
                const janelaCaixa = Ext.$('formmovimentoscaixa')[0];
                
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
