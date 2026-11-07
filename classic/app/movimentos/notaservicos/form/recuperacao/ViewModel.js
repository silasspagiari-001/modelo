Ext.define('SamosAdmin.movimentos.notaservicos.form.recuperacao.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel', 
    alias: 'viewmodel.formnotaservicosrecuperacao',

    constructor: function () {
        this.callParent(arguments); 

        this.setFormulas({
            hideRecuperar: function(get) {
                get('forceSelectionChange')
                const selection = this.getView().down('grid').getSelectionModel().getSelection() || [];

                return selection.length != 1;
            },

            hideExcluir: function(get) {
                get('forceSelectionChange')
                const selection = this.getView().down('grid').getSelectionModel().getSelection() || [];

                return selection.length == 0;
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                data: '{movimentosRecuperacao}',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});
