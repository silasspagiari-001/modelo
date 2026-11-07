Ext.define('SamosAdmin.relatorios.vendasvendedorprodutos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendasvendedorprodutoslist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/vendasvendedorprodutos`,
                        method: 'GET',
                        query: {
                            empresacnpj: configs.getEmpresa().cnpj,
                            inicio    : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                            final     : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
                            idUsuarioi: vm.get('valueIdUsuarioi'),
                            idUsuariof: vm.get('valueIdUsuariof'),
                            idGrupoi  : vm.get('valueIdGrupoi'),
                            idGrupof  : vm.get('valueIdGrupof'),
                            idProdutoi: vm.get('valueIdProdutoi'),
                            idProdutof: vm.get('valueIdProdutof'),
                            idPessoai : vm.get('valueIdPessoai'),
                            idPessoaf : vm.get('valueIdPessoaf'),
                            documento : vm.get('valueDocumento'),
                            vacina    : vm.get('valueVacina'),
                            prp       : vm.get('valuePRP')                            
                        }                                
                    });

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
