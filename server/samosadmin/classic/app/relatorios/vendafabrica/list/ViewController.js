Ext.define('SamosAdmin.relatorios.vendafabrica.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendafabricalist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');
        const viewRelatorio = this.getView();

        try {
            viewRelatorio.initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
                method: 'GET',
                timeout: 120000,
                query: this.getBuscarParams()
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            viewRelatorio.stopGauge();

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

        viewRelatorio.stopGauge();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa       : vm.get('valueIdEmpresa'),
            empresafan    : vm.get('valueEmpresa'),
            empresacnpj   : configs.getEmpresa().cnpj,
            grupoinicial  : vm.get('valueIdGrupoi'),
            grupofinal    : vm.get('valueIdGrupof'),
            pessoainicial : vm.get('valueIdPessoai'),
            pessoafinal   : vm.get('valueIdPessoaf'),            
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            documento     : vm.get('valueDocumento')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
