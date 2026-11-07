Ext.define('SamosAdmin.relatorios.lucratividade.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatorioslucratividadelist',

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
            empresa       : configs.getEmpresa().id,
            empresacnpj   : configs.getEmpresa().cnpj,
            produtoinicial: vm.get('valueIdProdutoi'),
            produtofinal  : vm.get('valueIdProdutof'),
            grupoinicial  : vm.get('valueIdGrupoi'),
            grupofinal    : vm.get('valueIdGrupof'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            usuario       : vm.get('valueIdUsuario')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
