Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.itens.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosmoveisagendamontagemitens',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({

            hideGravar: function (get) {
                return false;
            }

        });

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
