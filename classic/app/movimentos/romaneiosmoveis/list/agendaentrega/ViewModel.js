Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosmoveisagendaentrega',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir: false
        });
    }
});
