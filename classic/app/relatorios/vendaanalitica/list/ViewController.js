Ext.define('SamosAdmin.relatorios.vendaanalitica.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendaanaliticalist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');
        const viewRelatorio = Ext.$('relatoriosvendaanaliticalist')[0];

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
            empresa       : configs.getFinanceiros().multiEmpresa ? vm.get('valueIdEmpresa') : configs.getEmpresa().id,
            empresafan    : vm.get('valueEmpresa'),
            empresacnpj   : configs.getEmpresa().cnpj,
            produtoinicial: vm.get('valueIdProdutoi'),
            produtofinal  : vm.get('valueIdProdutof'),
            grupoinicial  : vm.get('valueIdGrupoi'),
            grupofinal    : vm.get('valueIdGrupof'),
            pessoa        : vm.get('valueIdPessoas'), 
            codprofissio  : vm.get('valueIdUsuarios'),
            nomeprofissio : vm.get('valueProfissional'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            documento     : vm.get('valueDocumento'),
            ordem         : vm.get('valueOrdem')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
