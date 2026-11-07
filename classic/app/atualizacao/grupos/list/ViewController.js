Ext.define('SamosAdmin.atualizacao.grupos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.grupos',

    getBuscarParams: function () {
        var vm = this.getViewModel();
        
        return {
            conteudo: vm.get('valueConteudo'),
            ordem: vm.get('valueOrdem'),
            status: vm.get('valueStatus'),
            descven    : configs.getMovimentos().descontoMaximo,
            descsup    : configs.getMovimentos().descontoMaximoSupervisor,
            descdir    : configs.getMovimentos().descontoMaximoGerente
        }; 
    },

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const vm = this.getViewModel();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/grupos`,
                    method: 'GET',
                    query: {
                        empresa    : vm.get('valueIdEmpresa'),            
                        empresacnpj: configs.getEmpresa().cnpj,
                        conteudo   : vm.get('valueConteudo'),
                        ordem      : vm.get('valueOrdem'),
                        status     : vm.get('valueStatus'),
                        descven    : configs.getMovimentos().descontoMaximo,
                        descger    : configs.getMovimentos().descontoMaximo,
                        descsup    : configs.getMovimentos().descontoMaximoSupervisor,
                        descdir    : configs.getMovimentos().descontoMaximoGerente,
                        start      : 0,
                        limit      : 99999
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();         
    },

    recalculaGrid: function () {
        const form = Ext.$('formmovimentos')[0];
        const movimento = form.getViewModel().get('model');
        const itens = form.lookup('produtos').getStore().data.items;  

        const itensAtualizados = itens.map(item => {
            let qtde             = item.get('MOVIMENTOSITENS_QUANTIDADE');
            let entregueLoja     = item.get('MOVIMENTOSITENS_ENTREGUE');
            let entregueDeposito = item.get('MOVIMENTOSITENS_DEPOSITO');
            let entregaImediata  = item.get('MOVIMENTOSITENS_IMEDIATA');

            if(!this.getRecord().isNew()) {
                item.set('ITENS_ENTREGAR',  (qtde - entregueLoja - entregueDeposito - entregaImediata));
            }

            return item.data;
        });
        
        movimento.set('MOVIMENTOS_ITENS', itensAtualizados);

    }

});
