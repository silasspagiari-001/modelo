Ext.define('SamosAdminModern.notificacao.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.notificacao',

    showButtons: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').hide();
        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });

        this.onPesquisarClick();
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
                inicio  : vm.get('valueInicio'),
                final   : vm.get('valueFinal'),
                ordem   : 0,
                status  : vm.get('valueStatus')
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('notificacaoform');
        main.down('container[reference="title"]').setHtml('Notificação');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': record,
            'readOnly': true,
            'initialValues': Object.assign({}, record.data)
        });
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');

        main.down('image[reference="logo"]').show();
        main.down('panel').setActiveItem('menulist');
        main.down('container[reference="title"]').setHtml('Menu');
        main.getViewModel().set({
            hideVoltar : true,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        })
    }
});
