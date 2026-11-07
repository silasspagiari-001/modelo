Ext.define('SamosAdmin.relatorios.margembrutafaturada.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosmargembrutafaturadalist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/margembrutafaturada`,
                        method: 'GET',
                        timeout: 720000,                        
                        query: {
                            empresacnpj: configs.getEmpresa().cnpj,
                            inicio     : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                            final      : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
                            idPessoai  : vm.get('valueIdPessoai'),
                            idPessoaf  : vm.get('valueIdPessoaf'),
                            idFornecedori  : vm.get('valueIdFornecedori'),
                            idFornecedorf  : vm.get('valueIdFornecedorf'),
                            idProdutoi : vm.get('valueIdProdutoi'),
                            idProdutof : vm.get('valueIdProdutof'),
                            idGrupoi   : vm.get('valueIdGrupoi'),
                            idGrupof   : vm.get('valueIdGrupof'),
                            idUsuarioi : vm.get('valueIdUsuarioi'),
                            idUsuariof : vm.get('valueIdUsuariof'),
                            prp        : vm.get('valuePRP'),                            
                            documento : vm.get('valueDocumento'),
                            ordem     : vm.get('valueOrdem'),
                            quebra    : vm.get('valueQuebra')
                        }                                
                    });

                    await SamosUtils.Utils.sleep(12000); 

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
                    Ext.Note('error', 'Erro no servidor');
                    console.error(error);
                }
                this.getView().stopGauge()
            }
        });
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
