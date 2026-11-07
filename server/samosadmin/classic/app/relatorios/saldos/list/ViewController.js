Ext.define('SamosAdmin.relatorios.saldos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriossaldoslist',

    initViewModel: function(vm) {  
        this.callParent(arguments);
        setTimeout(() => {
            vm.set('valuePessoa', '');
            vm.set('valueAtePessoa', '');
            vm.set('valueGrupo', '');
            vm.set('valueAteGrupo', '');
            vm.set('valueProduto', '');
            vm.set('valueAteProduto', '');
        }, 500);
    },

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');
        const relatorioView = Ext.$('relatoriossaldoslist')[0];

        try {
            relatorioView.initGauge('Gerando impressão...');
    
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${this.type.replace('relatorios', '').replace('list', '')}`,
                method: 'GET',
                timeout: 120000,
                query: this.getBuscarParams()
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            relatorioView.stopGauge();

            //Exibe o PDF
            if(queryPDF.results[0]) {
                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            } else {
                Ext.Note('warning', 'Nenhum registro')
            }
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        relatorioView.stopGauge();
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa: configs.getEmpresa().id,
            empresacnpj: configs.getEmpresa().cnpj,
            empresanome: configs.getEmpresa().nome,
            tipo: vm.get('valueTipo'),
            preco: vm.get('valuePreco'),
            status:vm.get('valueStatus'),
            ordem:vm.get('valueOrdem'),
            pessoainicial: vm.get('valueIdPessoai'),
            pessoafinal: vm.get('valueIdPessoaf'),
            grupoinicial: vm.get('valueIdGrupoi'),
            grupofinal: vm.get('valueIdGrupof'),
            produtoinicial: vm.get('valueIdProdutoi'),
            produtofinal: vm.get('valueIdProdutof'),
            auditoria: vm.get('valueAuditoria')
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
