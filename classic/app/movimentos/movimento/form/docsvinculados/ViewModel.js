Ext.define('SamosAdmin.movimentos.movimento.form.docsvinculados.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosdocsvinculados',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') || 
                       get('movimento.MOVIMENTOS_STATUS') != 'N';
            },

            hideConfirmar: function(get) {
                return get('hideFechar') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                
                return get('readOnly') ||
                       get('movimento').isNew() ||
                       !formMovimento.getViewModel().get('readOnly');
            },

            disableConfirmar: function(get) {
                return false;
            },

            disableGravar: function(get) {
                return false;
            }
        });
    }
});
