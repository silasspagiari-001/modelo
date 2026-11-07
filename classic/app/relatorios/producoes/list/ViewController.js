Ext.define('SamosAdmin.relatorios.producoes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosproducoeslist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');

        try {
            this.getView().initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
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

        return {
            empresa       : configs.getEmpresa().id,
            empresafan    : vm.get('valueEmpresa'),
            empresacnpj   : configs.getEmpresa().cnpj,
            produtoinicial: vm.get('valueIdProdutoi'),
            produtofinal  : vm.get('valueIdProdutof'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final         : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
