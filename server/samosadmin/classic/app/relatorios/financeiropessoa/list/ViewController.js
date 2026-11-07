Ext.define('SamosAdmin.relatorios.financeiropessoa.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosfinanceiropessoalist',

    onImprimirClick: function (btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const vm = this.getViewModel();
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/financeiropessoa`,
                        method: 'GET',
                        timeout: 120000,                        
                        data: {
                            empresa    : (configs.getFinanceiros().multiEmpresa ? vm.get('valueIdEmpresa') : configs.getEmpresa().id),
                            empresacnpj: configs.getEmpresa().cnpj,
                            tipo       : (vm.get('valueTipo') == 0 ? 'R' : 
                                          vm.get('valueTipo') == 1 ? 'P' : 'T'),
                            pesinicio  : this.lookup('codpessoai').getValue(),
                            pesfinal   : this.lookup('codpessoaf').getValue(),
                            porinicio  : this.lookup('codportadori').getValue(),
                            porfinal   : this.lookup('codportadorf').getValue(),
                            aplinicio  : this.lookup('codaplicacaoi').getValue(),
                            aplfinal   : this.lookup('codaplicacaof').getValue(),
                            cusinicio  : this.lookup('codcustoi').getValue(),
                            cusfinal   : this.lookup('codcustof').getValue(),
                            vloinicio  : this.lookup('vloinicio').getValue(),
                            vlofinal   : this.lookup('vlofinal').getValue(),
                            emiinicio  : momentTz(this.lookup('emiinicio').getValue()).format('DD/MM/YYYY'),
                            emifinal   : momentTz(this.lookup('emifinal').getValue()).format('DD/MM/YYYY'),
                            vctinicio  : momentTz(this.lookup('vctinicio').getValue()).format('DD/MM/YYYY'),
                            vctfinal   : momentTz(this.lookup('vctfinal').getValue()).format('DD/MM/YYYY'),
                            paginicio  : momentTz(this.lookup('pgtinicio').getValue()).format('DD/MM/YYYY'),
                            pagfinal   : momentTz(this.lookup('pgtfinal').getValue()).format('DD/MM/YYYY'),
                            database   : momentTz(this.lookup('database').getValue()).format('DD/MM/YYYY'),
                            status     : vm.get('valueStatus')
                        }                                
                    });

                    await SamosUtils.Utils.sleep(1000);  
                    
                    this.getView().stopGauge()

                    if(queryPdf.results[0]) {
                        SamosUtils.Pdf.exibir({
                            local: 'window',
                            caminho: queryPdf.results[0]['name'], 
                            serverType: 'nodejs'
                        });
                    } else {
                        Ext.Note('warning', 'Nenhum registro')
                    }
                } catch(error) {
                    this.getView().stopGauge();                    
                    Ext.Note('error', 'Erro no servidor');
                    console.error(error);
                }

            }
        });
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }

});
