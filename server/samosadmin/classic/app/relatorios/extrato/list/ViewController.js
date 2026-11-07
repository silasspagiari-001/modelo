Ext.define('SamosAdmin.relatorios.extrato.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosextratolist',

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
            empresacnpj: configs.getEmpresa().cnpj,
            portador   : vm.get('valueIdPortador'),
            tipo       : vm.get('valueTipo'),
            inicio     : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final      : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            status     : vm.get('valueStatus')             
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
