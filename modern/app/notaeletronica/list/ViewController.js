Ext.define('SamosAdminModern.notaeletronica.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.notaeletronica',

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
                numero        : '',
                empresa       : configs.getEmpresa().id,
                pessoa        : '',
                documento     : '', //trazer pelo nome
                nomedocumento : 'Nota Eletrônica',
                filtravendedor: (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
                movimentosnome: vm.get('valueConteudo'),
                inicio        : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
                final         : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
                ordem         : vm.get('valueOrdem'),
                status        : vm.get('valueStatus')
            });

            store.load();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao buscar')
        }

        view.stopGauge();
    },

    onItemClick: async function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        try {
            main.initGauge();

            const movimentoCompleto = await NotaEletronica.services.Model.get(record.get('MOVIMENTOS_ID'));

            if(movimentoCompleto) {
                record.set(movimentoCompleto[0].data);
                main.down('panel').setActiveItem('notaeletronicaform');
                main.down('container[reference="title"]').setHtml('Nota Eletrônica');

                const obs = record.get('MOVIMENTOS_OBSERVACOES');

                record.set('MOVIMENTOS_OBSERVACOES', obs.replace(/\|/ig, '\n'));

                main.getViewModel().set({
                    hideVoltar : false,
                    hideExcluir: true,
                    hideAlterar: true,
                    hideGravar : true,
                    hideNovo   : true
                });
        
                main.down('panel').getActiveItem().getViewModel().set({
                    'model': record,
                    'readOnly': true,
                    'initialValues': Object.assign({}, record.data),
                    'forceChangeId': new Date()
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar movimento');
        }
        
        main.stopGauge();
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
