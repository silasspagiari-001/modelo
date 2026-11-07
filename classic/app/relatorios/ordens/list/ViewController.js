Ext.define('SamosAdmin.relatorios.ordens.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosordenslist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');

        try {
            this.getView().initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                //url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
                url: `/relatorios/${configs.getClientName()}/relordemservico`,
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
        var idDocumento = parseInt(vm.get('valueDocumento'));        
        var parDocumento = (idDocumento + (idEmpresa * 10000));
        var relStatus = vm.get('valueStatus');

        return {
            empresa       : idEmpresa,
            empresacnpj   : configs.getEmpresa().cnpj,
            pessoa        : vm.get('valueIdPessoa'),
            ordensnome    : vm.get('valuePessoa'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem         : vm.get('valueOrdem'),
            status        : relStatus,
            operacao      : vm.get('valueOperacao'),
            iddocumento   : idDocumento
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
