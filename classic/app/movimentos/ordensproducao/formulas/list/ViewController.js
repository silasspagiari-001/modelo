Ext.define('SamosAdmin.movimentos.ordensproducao.formulas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.ordensproducaoformulas',

    moduleName: 'ordensproducaoformulas',//por causa da str 'form'

    getServerUrl: function() {
        return 'server/ordensproducaoformulas';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            produto : vm.get('valueIdProduto'),
            status  : vm.get('valueStatus'),
            ordem   : vm.get('valueOrdem')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            view.initGauge();
    
            const queryFormulaCompleta = await SamosUtils.Request.nodeApi({
                url: `/ordensproducaoformulas/${record.get('PRODUCOESFORMULAS_ID_PRODUTOS')}`,
                method: 'GET'
            });
            
            if(queryFormulaCompleta) {
                record.set(queryFormulaCompleta.results[0])
                await this.createForm(record, true, view);
                await SamosUtils.Utils.sleep(1000);
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível carregar a fórmula');
        }

        view.stopGauge();
    }
});
