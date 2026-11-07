Ext.define('SamosAdmin.relatorios.produtos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosprodutoslist',

    onBuscarClick: async function () {
        const view = this.getView();

        try {
            view.initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
                method: 'GET',
                timeout: 120000,
                query: this.getBuscarParams()
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            view.stopGauge();
            
            SamosUtils.Pdf.exibir({
                local: 'window',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();
        
        return {
            empresacnpj : configs.getEmpresa().cnpj,
            ordem       : vm.get('valueOrdem'),
            status      : vm.get('valueStatus'),
            grupoinicial: vm.get('valueIdGrupoi'),
            grupofinal  : vm.get('valueIdGrupof')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
