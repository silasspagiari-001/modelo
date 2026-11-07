Ext.define('SamosAdminModern.receber.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.receber',

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
        const isCliente = configs.getUsuario().tipo == ((configs.getUsuarios().tipos || []).find(tipo => tipo[1] == 'Clientes') || [])[0];

        try {
            view.initGauge();

            const store = vm.getStore('main');
            
            store.currentPage = 1;

            store.getProxy().setExtraParams({
                empresa   : configs.getFinanceiros().multiEmpresa ? '' : configs.getEmpresa().id,
                numero    : '',
                portador  : '',
                pessoa    : (!isCliente ? '' : configs.getUsuario().nome) == '' ? '' : (!isCliente ? '' : configs.getUsuario().cpfcnpj),
                nomePessoa: vm.get('valueConteudo'),
                inicio    : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
                final     : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
                ordem     : vm.get('valueOrdem'),
                status    : vm.get('valueStatus'),
                tipo      : 'R',

/*
                pessoa: 46130523000153
                log: GET /financeiros
                page: 1
                start: 0
                limit: 9999999*/
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('receberform');
        main.down('container[reference="title"]').setHtml('Financeiro');

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
