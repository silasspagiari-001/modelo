Ext.define('SamosAdmin.relatorios.controlevacinas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatorioscontrolevacinaslist',

    onImprimirClick: function (btn, e) {
        const vm  = this.getViewModel();
    
        Ext.Msg.confirm('Confirmação', 'Deseja realmente imprimir?', async btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Imprimindo...');

                try {
                    const queryPdf = await SamosUtils.Request.nodeApi({
                        url: `/relatorios/${configs.getClientName()}/controlevacinas`,
                        method: 'GET',
                        query: {
                            inicio        : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                            final         : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
                            nota          : vm.get('valueNota')
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
