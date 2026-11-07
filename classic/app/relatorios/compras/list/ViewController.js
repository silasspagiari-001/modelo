Ext.define('SamosAdmin.relatorios.compras.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatorioscompraslist',
 
    onImprimirClick: async function (btn, e) {

        this.getView().initGauge('Imprimindo...');

        try {
            const vm = this.getViewModel();

            const queryPdf = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/compras`,
                method: 'GET',
                data: {
                    empresa    : vm.get('valueIdEmpresa'),
                    empresacnpj: configs.getEmpresa().cnpj,
                    tipo       : vm.get('valueTipo'),
                    grupo      : vm.get('valueIdGrupo'),
                    pessoa     : vm.get('valueIdPessoa'),
                    inicio     : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                    final      : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
                    meses      : vm.get('valueMeses')            
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
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
