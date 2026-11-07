Ext.define('SamosAdmin.movimentos.romaneiosmoveis.form.itens.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.romaneiosmoveisitens',

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
                model: 'SamosAdmin.movimentos.romaneiosmoveis.form.itens.Model',
                autoLoad: true,
                proxy: {
                    url: 'server/produtosromaneiomontagem',
                    extraParams: {
                        id: '{model.ROMANEIOSITENS_ID_MOVIMENTOS}',
                        start: 0, 
                        limit: 9999
                    }
                }
            }
        });
    } 
});
