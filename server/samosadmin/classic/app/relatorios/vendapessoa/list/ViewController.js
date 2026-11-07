Ext.define('SamosAdmin.relatorios.vendapessoa.list.ViewController', {
    extend: 'SamosModule.list.ViewController', 
    alias: 'controller.relatoriosvendapessoalist',

    onImprimirClick: function (btn, e) {
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const vm = this.getViewModel();

                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/vendapessoa`,
                        method: 'GET',
                        data: {
                            empresa    : vm.get('valueIdEmpresa'),
                            empresacnpj: configs.getEmpresa().cnpj,
                            tipo       : vm.get('valueTipo'),
                            documento  : vm.get('valueDocumento'),
                            pesinicio  : vm.get('codpessoai'),
                            pesfinal   : vm.get('codpessoaf'),
                            proinicio  : vm.get('codprodutoi'),
                            profinal   : vm.get('codprodutof'),
                            grpinicio  : vm.get('codgrupoi'),
                            grpfinal   : vm.get('codgrupof'),
                            inicio     : momentTz(this.lookup('datainicio').getValue()).format('DD/MM/YYYY'),
                            final      : momentTz(this.lookup('datafinal').getValue()).format('DD/MM/YYYY'),
                            itens      : vm.get('valueItens'),
                            operacoes  : vm.get('valueOperacoes'),
                            estado     : vm.get('valueEstado')
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
