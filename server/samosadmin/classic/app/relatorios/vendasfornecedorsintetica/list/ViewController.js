Ext.define('SamosAdmin.relatorios.vendasfornecedorsintetica.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendasfornecedorsinteticalist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/vendasfornecedorsintetica`,
                        method: 'GET',
                        query: {
                            inicio     : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                            final      : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
                            idPessoai  : vm.get('valueIdPessoai'),
                            idPessoaf  : vm.get('valueIdPessoaf'),
                            idGrupoi   : vm.get('valueIdGrupoi'),
                            idGrupof   : vm.get('valueIdGrupof'),
                            ordem      : vm.get('valueOrdem'),
                            preco      : vm.get('valuePreco'),
                            bonificacao: vm.get('valueBonificacao')
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
