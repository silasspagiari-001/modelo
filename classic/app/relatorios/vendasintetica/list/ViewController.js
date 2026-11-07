Ext.define('SamosAdmin.relatorios.vendasintetica.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendasinteticalist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');
        const relatorioView = Ext.$('relatoriosvendasintetica')[0];

        try {
            relatorioView.initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
                method: 'GET',
                timeout: 120000,
                query: this.getBuscarParams()
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            relatorioView.stopGauge();

            //Exibe o PDF
            if(queryPDF.results[0]) {
                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

                this.onSairClick();
            } else {
                Ext.Note('warning', 'Nenhum registro')
            }
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        relatorioView.stopGauge();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa         : (configs.getClientName() == 'hermes' || configs.getClientName() == 'lislais') ? configs.getEmpresa().id : vm.get('valueIdEmpresa'),
            empresafan      : (configs.getClientName() == 'hermes' || configs.getClientName() == 'lislais') ? configs.getPermissao()["EMPRESAS_FANTASIA"] : vm.get('valueEmpresa'),
            empresacnpj     : configs.getEmpresa().cnpj,
            produtoinicial  : vm.get('valueIdProdutoi'),
            produtofinal    : vm.get('valueIdProdutof'),
            grupoinicial    : vm.get('valueIdGrupoi'),
            grupofinal      : vm.get('valueIdGrupof'),
            usuarioinicial  : vm.get('valueIdUsuarioi'),
            usuariofinal    : vm.get('valueIdUsuariof'),
            pessoa          : vm.get('valueIdPessoas'),
            inicio          : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final           : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            documento       : vm.get('valueDocumento')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
