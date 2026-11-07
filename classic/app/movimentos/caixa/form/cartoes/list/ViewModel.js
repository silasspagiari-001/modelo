Ext.define('SamosAdmin.movimentos.caixa.form.cartoes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.formcaixacartoes',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return !get('readOnly') || get('isFechado');
            },

            hideConfirmar: function (get) {
                return get('readOnly') || !get('hideGravar');   
            },
            
            hideGravar: function (get) {
                const janelaCaixa = Ext.$('formcaixa')[0];
                
                return get('readOnly') ||
                       get('caixa').isNew() ||
                       !janelaCaixa.getViewModel().get('readOnly');
            },

        });
    }
});
