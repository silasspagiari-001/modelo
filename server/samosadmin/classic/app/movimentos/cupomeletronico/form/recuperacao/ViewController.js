Ext.define('SamosAdmin.movimentos.cupomeletronico.form.recuperacao.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.formcupomeletronicorecuperacao',

    onItemDblClick: Ext.emptyFn,

    onSelectionChange: function(selModel, records){
        this.getViewModel().set('forceSelectionChange', new Date());
    },

    onRecuperarClick: async function (btn, e) {
        const selecionados = this.getView().down('grid').getSelectionModel().getSelection() || [];
        const recuperado = selecionados[0];

        if(recuperado) {
            const form = this.getView().up('formcupomeletronico');
            const abaNavegador = recuperado.get('NAVEGADOR_TAB_ID');

            form.initGauge('Recuperando...');
            form.getViewModel().get('model').set(recuperado.data);
            CupomEletronico.services.Recuperacao.apagar(recuperado, abaNavegador);
            form.applyTextSearches();
            this.onSairClick();
        }
    },

    onExcluirClick: function (btn, e) {
        const store = this.getViewModel().get('main');
        const selecionados = this.getView().down('grid').getSelectionModel().getSelection() || [];
        
        selecionados.forEach(recuperado => {
            const abaNavegador = recuperado.get('NAVEGADOR_TAB_ID');

            CupomEletronico.services.Recuperacao.apagar(recuperado, abaNavegador);
            store.remove(recuperado);

            if(store.data.items.length == 0){
                this.onSairClick();
            }
        });
    }
});
