Ext.define('SamosAdmin.relatorios.vendasproduto.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendasprodutolist',
 
    onImprimirClick: async function (btn, e) {

        this.getView().initGauge('Imprimindo...');

        try {
            const vm = this.getViewModel();

            const queryPdf = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/vendasproduto`,
                method: 'GET',
                data: {
                    empresa    : (configs.getClientName() == 'prudenmoveis' ? 1 : configs.getEmpresa().id), // Se pruden, compra sempre se baseia no CD
                    empresacnpj: configs.getEmpresa().cnpj,
                    grupo      : vm.get('valueIdGrupo'),
                    pessoa     : vm.get('valueIdPessoa'),
                    inicio     : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
                    final      : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD')
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
