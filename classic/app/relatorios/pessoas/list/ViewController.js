Ext.define('SamosAdmin.relatorios.pessoas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.relatoriospessoaslist',

    onImprimirClick: async function () {
        const view = this.lookup('pdfviewlocal');
        const relatorioView = Ext.$('relatoriospessoaslist')[0];

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

    onFiltrosClick: function(btn, e) {
        const view = Ext.create({
            xtype: 'formpessoasfiltro'
        });

        this.getView().add(view);
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresacnpj: configs.getEmpresa().cnpj,
            tipo       : vm.get('valueTipo'),
            ordem      : vm.get('valueOrdem'),
            status     : vm.get('valueStatus'),
            inicio     : this.lookup('inicial').getValue() || '',
            final      : this.lookup('final').getValue()   || '',
            //Parametros dos filtros avançados
            relacao    : vm.get('valueRelacionar') ? vm.get('valueRelacionar') : '',
            datainicio : vm.get('valueDataini')    ? momentTz(vm.get('valueDataini')).format('DD/MM/YYYY') : 'Data inválida',
            datafinal  : vm.get('valueDatafin')    ? momentTz(vm.get('valueDatafin')).format('DD/MM/YYYY') : 'Data inválida'
        };
    },

    onSairClick: function() {
        this.getView().up('window').destroy();
    }
});
