Ext.define('SamosAdminModern.pedidos.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.pedidos',

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
                nomedocumento : 'Pedidos',
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

    onTotalizadorClick: async function() {
        const store = this.getViewModel().getStore('main');
        const pedidos = store.data.items;
        const valor = pedidos[0] ? pedidos[0].get('TOTAL_MOVIMENTOS') : 0;

        SamosUtils.Msg.alert('Totalizador', `<span style="font-size:18px;color:blue">Quantidade: <b>${store.getTotalCount()}</b><br><br>Total: <b>${Ext.util.Format.maskRenderer('R$ #9.990,00', true)(valor)}</b></span>`)
    },

    onItemClick: async function (dataview, index, target, record, e) {
        const main = this.getView().up('main');

        try {
            main.initGauge();

            const movimentoCompleto = await Pedido.services.Model.get(record.get('MOVIMENTOS_ID'));

            if(movimentoCompleto) {
                record.set(movimentoCompleto[0].data);
                main.down('panel').setActiveItem('pedidosform');
                main.down('container[reference="title"]').setHtml('Pedido');

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
