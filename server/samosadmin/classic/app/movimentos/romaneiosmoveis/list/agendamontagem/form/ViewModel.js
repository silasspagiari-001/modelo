Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.romaneiosmoveisagendamontagemform',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating');
            },

            hideGravar: function (get) {
                return get('readOnly');
            }
        });
    }
});
