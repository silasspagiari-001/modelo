Ext.define('SamosAdmin.relatorios.ordemcarregamento.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosordemcarregamentolist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');

        try {
            this.getView().initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/ordemcarregamento`,
                method: 'GET',
                timeout: 120000,
                query: this.getBuscarParams()
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            this.getView().stopGauge();

            //Exibe o PDF
            if(queryPDF.results[0]) {
                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            } else {
                Ext.Note('warning', 'Nenhum registro')
            }
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        this.getView().stopGauge();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();
        var idEmpresa = parseInt(configs.getEmpresa().id);

        return {
            empresa       : idEmpresa,
            empresacnpj   : configs.getEmpresa().cnpj,
            usuario       : vm.get('valueIdUsuario'),
            usuarionome   : vm.get('valueUsuario'),
            inicio        : this.lookup('inicial').getValue(),
            final         : this.lookup('final').getValue()
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
