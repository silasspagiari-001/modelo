Ext.define('SamosAdminModern.ceps.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.ceps',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    },

    onPesquisarClick: function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            view.initGauge();

            const store = vm.getStore('main');
            
            store.currentPage = 1;

            store.getProxy().setExtraParams({
                conteudo: vm.get('valueConteudo'),
                cidade  : vm.get('valueCidade'),
                estado  : vm.get('valueEstado'),
                ordem   : vm.get('valueOrdem')
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        this.onVoltarClick();

        const model = main.down('panel').getActiveItem().getViewModel().get('model');

        this.getView().target.fields.forEach(field => {
            model.set(field[0], record.get(field[1]))
        })
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').show();
        main.down('panel').setActiveItem(this.getView().target.module);
        main.down('container[reference="title"]').setHtml(this.getView().target.title);
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : false,
            hideNovo   : true
        });
    }
});
