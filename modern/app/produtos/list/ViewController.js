Ext.define('SamosAdminModern.produtos.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.produtos',

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
                empresa   : configs.getEmpresa().id,
                conteudo  : vm.get('valueConteudo'),
                ordem     : vm.get('valueOrdem'),
                status    : 'T',
                tipopreco : configs.getMovimentos().tipoPreco
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('produtosform');
        main.down('container[reference="title"]').setHtml('Saldos');

        main.down('panel').getActiveItem().getViewModel().set({
            'model': record,
            'readOnly': true,
            'initialValues': Object.assign({}, record.data)
        });

        if(record.get('PROMOCOES')[0]) {
            main.down('panel').getActiveItem().getViewModel().set('hidePromocao', false)

            main.getViewModel().set({
                hideVoltar : false,
                hideExcluir: true,
                hideAlterar: false,
                hideGravar : true,
                hideNovo   : true
            })
        } else {
            main.down('panel').getActiveItem().getViewModel().set('hidePromocao', true)

            main.getViewModel().set({
                hideVoltar : false,
                hideExcluir: true,
                hideAlterar: true,
                hideGravar : true,
                hideNovo   : true
            })
        }
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
