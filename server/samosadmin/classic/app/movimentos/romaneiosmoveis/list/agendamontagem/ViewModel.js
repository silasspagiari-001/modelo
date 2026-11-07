Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosmoveisagendamontagem',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir: false
        });
    }
});