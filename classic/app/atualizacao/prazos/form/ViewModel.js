Ext.define('SamosAdmin.atualizacao.prazos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formprazos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') || get('model.PRAZOS_ID') < 10;
            },

            hideExcluir: function(get) {
                return get('updating') || get('model.PRAZOS_ID') < 10;
            },

            hideIntervalo: function(get){
                return !get('updating')
            }
        });
    }
});
