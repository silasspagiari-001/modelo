Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.itens.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosmoveisagendaentregaitens',

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
