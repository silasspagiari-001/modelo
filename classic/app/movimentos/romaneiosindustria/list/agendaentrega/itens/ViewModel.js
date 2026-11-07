Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.agendaentrega.itens.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosindustriaagendaentregaitens',

    constructor: function () {
        this.callParent(arguments);

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.movimentos.movimento.ModelItens',
                autoLoad: true,
                data: '{model.MOVIMENTOS_ITENS}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    } 
});
