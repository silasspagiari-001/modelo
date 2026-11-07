Ext.define('SamosAdmin.relatorios.listacompras.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatorioslistacompraslist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/listacompras`,
                        method: 'GET',
                        query: {
                            empresa      : configs.getEmpresa().id,
                            empresacnpj  : configs.getEmpresa().cnpj,
                            pessoainicial: vm.get('valueIdPessoai'),
                            pessoafinal  : vm.get('valueIdPessoaf'),
                            grupoinicial : vm.get('valueIdGrupoi'),
                            grupofinal   : vm.get('valueIdGrupof'),
                            precos       : vm.get('valuePrecos')
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
