Ext.define('SamosAdmin.relatorios.comissoesfin.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatorioscomissoesfinlist',

    onImprimirClick: async function () { 
        const view = this.lookup('pdfviewlocal'); 
        const viewRelatorio = this.getView();

        if(!this.permiteEmitir && configs.getClientName() == 'pinguim'){
            const nivel = 1;
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
            this.permiteEmitir = true;
            this.onBuscarClick();
        } else {
            delete this.permiteEmitir;
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
        }
        viewRelatorio.stopGauge();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa    : configs.getClientName() == 'lislais' ? (vm.get('valueIdEmpresa') || configs.getEmpresa().id) : vm.get('valueIdEmpresa'),
            empresacnpj: configs.getEmpresa().cnpj,
            tipo       : vm.get('valueTipo'),
            ordem      : vm.get('valueOrdem'),
            status     : vm.get('valueStatus'),
            vendedor   : configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor ? configs.getUsuario().id : vm.get('valueIdVendedor'),
            emiinicio  : momentTz(this.lookup('emissao').getValue()).format('DD/MM/YYYY'),
            emifinal   : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            vctinicio  : momentTz(this.lookup('periodo').getValue()).format('DD/MM/YYYY'),
            vctfinal   : momentTz(this.lookup('ate').getValue()).format('DD/MM/YYYY')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
