Ext.define('SamosAdmin.atualizacao.relacoes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relacoes',

    getServerUrl: function() {
        return 'server/relacoes';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            ordem   : vm.get('valueOrdem')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            view.initGauge();
    
            const queryRelacaoCompleta = await SamosUtils.Request.nodeApi({
                url: `/relacoes/${record.get('RELACOES_ID')}`,
                method: 'GET'
            });
            
            if(queryRelacaoCompleta) {
                record.set(queryRelacaoCompleta.results[0])
                await this.createForm(record, true, view);
                await SamosUtils.Utils.sleep(1000);
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível carregar a relação');
        }
        
        view.stopGauge();
    }
});
