Ext.define('SamosAdminModern.pessoas.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pessoas',

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

            let conteudo = vm.get('valueConteudo');
            let ordem = 0;

            if (conteudo && conteudo.substr(0, 1) == '*') {
                conteudo = conteudo.substr(1, 100).trim();
                ordem    = '1';
            } else if (conteudo && conteudo.substr(0, 1) == '+') {
                conteudo = conteudo.substr(1, 100).trim();
                ordem    = '8';
            } else if (SamosUtils.String.onlyNumbers(conteudo).length > 0) {
                conteudo = conteudo.trim();
                if (conteudo.length < 10 ) {
                    ordem = '1';
                } else {
                    ordem = '4';
                }
            }

            const store = vm.getStore('main');
            
            store.currentPage = 1;

            store.getProxy().setExtraParams({
                conteudo: conteudo,
                ordem   : ordem
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('pessoasform');
        main.down('container[reference="title"]').setHtml('Pessoa');

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
