Ext.define('SamosAdmin.relatorios.vendacomparativa.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriosvendacomparativalist',

    onImprimirClick: async function (btn, e) {
        
        this.getView().initGauge('Imprimindo...');

        try {
            const vm = this.getViewModel();

            const queryPdf = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/vendacomparativa`,
                method: 'GET',
                data: {
                    empresa      : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
                    empresacnpj  : configs.getEmpresa().cnpj,
                    pessoainicial: vm.get('codpessoai'),
                    pessoafinal  : vm.get('codpessoaf'),
                    grupoinicial : vm.get('codgrupoi'),
                    grupofinal   : vm.get('codgrupof'),
                    inicio       : momentTz(this.lookup('datainicio').getValue()).format('DD/MM/YYYY'),
                    final        : momentTz(this.lookup('datafinal').getValue()).format('DD/MM/YYYY'),
                    ordem        : vm.get('valueOrdem'),
                    tipo         : vm.get('valueTipo'),
                    cidade       : vm.get('codcidade'),
                    produto      : vm.get('codproduto')
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