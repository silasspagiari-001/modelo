Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.agendaentrega.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.romaneiosindustriaagendaentregaform',

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
