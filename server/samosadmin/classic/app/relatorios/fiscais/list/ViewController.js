Ext.define('SamosAdmin.relatorios.fiscais.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosfiscaislist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const livroFiscal = (
                        vm.get('valueFiscais') == '0' ? 'resumoicms'     : 
                        vm.get('valueFiscais') == '1' ? 'livroicms'      : 
                        vm.get('valueFiscais') == '2' ? 'livropiscofins' :
                        vm.get('valueFiscais') == '3' ? 'apuracaoicms'   :
                                                        'danfes'
                    );
   
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/${livroFiscal}`,
                        method: 'GET',
                        timeout: 360000,
                        query: {
                            empresa    : configs.getEmpresa().id,                        
                            empresacnpj: configs.getEmpresa().cnpj,
                            empresanome: configs.getEmpresa().nome,
                            livro      : vm.get('valueFiscais'),
                            tipo       : vm.get('valueTipo'),
                            inicio     : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                            final      : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD')
                        }                                
                    });

                    await SamosUtils.Utils.sleep(6000);

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
