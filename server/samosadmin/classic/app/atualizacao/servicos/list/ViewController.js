Ext.define('SamosAdmin.atualizacao.servicos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.servicos',


    getBuscarParams: function () {
        var vm = this.getViewModel();
        
        return {
            conteudo: vm.get('valueConteudo'),
            ordem: vm.get('valueOrdem'),
            status: vm.get('valueStatus')
        }; 
    },

    onImprimirClick: async function () {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const vm = this.getViewModel();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/servicos`,
                    method: 'GET',
                    query: {
                        empresa    : vm.get('valueIdEmpresa'),            
                        empresacnpj: configs.getEmpresa().cnpj,
                        conteudo   : vm.get('valueConteudo'),
                        ordem      : vm.get('valueOrdem'),
                        status     : vm.get('valueStatus'),
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
    }
});
