Ext.define('SamosAdmin.movimentos.notaconsumidor.form.recuperacao.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.formnotaconsumidorrecuperacao',

    onItemDblClick: Ext.emptyFn,

    onSelectionChange: function(selModel, records){
        this.getViewModel().set('forceSelectionChange', new Date());
    },

    onRecuperarClick: async function (btn, e) {
        const selecionados = this.getView().down('grid').getSelectionModel().getSelection() || [];
        const recuperado = selecionados[0];

        if(recuperado) {
            const form = this.getView().up('formnotaconsumidor');
            const abaNavegador = recuperado.get('NAVEGADOR_TAB_ID');

            form.initGauge('Recuperando...');
            form.getViewModel().get('model').set(recuperado.data);
            NotaConsumidor.services.Recuperacao.apagar(recuperado, abaNavegador);
            form.applyTextSearches();
            this.onSairClick();
        }
    },

    onExcluirClick: function (btn, e) {
        const store = this.getViewModel().get('main');
        const selecionados = this.getView().down('grid').getSelectionModel().getSelection() || [];
        
        selecionados.forEach(recuperado => {
            const abaNavegador = recuperado.get('NAVEGADOR_TAB_ID');

            NotaConsumidor.services.Recuperacao.apagar(recuperado, abaNavegador);
            store.remove(recuperado);

            if(store.data.items.length == 0){
                this.onSairClick();
            }
        });
    }
});
