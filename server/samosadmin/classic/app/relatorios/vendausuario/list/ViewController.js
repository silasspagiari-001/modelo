Ext.define('SamosAdmin.relatorios.vendausuario.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendausuariolist',

    onImprimirClick: async function () {

        if(configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) {
            if(momentTz(this.lookup('inicio').getValue()).isBefore(momentServer().startOf('month')) ||
                momentTz(this.lookup('final').getValue()).isAfter(momentServer().endOf('month'))) {
                Ext.Note('warning', 'Período selecionado Inválido - Corrigir');
                return;
            } 
        }

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
            empresa    : (configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) ? configs.getEmpresa().id : vm.get('valueIdEmpresa'),
            empresacnpj: configs.getEmpresa().cnpj,
            fantasia   : configs.getEmpresa().nome,  
            clientname : configs.getClientName(),   
            tipo       : vm.get('valueTipo'),
            documento  : vm.get('valueDocumento'),
            vendedor   : vm.get('valueIdUsuario'),
            inicio     : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final      : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});