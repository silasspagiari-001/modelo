Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.agendaentrega.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosindustriaagendaentrega',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir: false
        });
    }
});
