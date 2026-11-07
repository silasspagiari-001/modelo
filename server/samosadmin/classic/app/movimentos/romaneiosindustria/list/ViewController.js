Ext.define('SamosAdmin.movimentos.romaneiosindustria.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.romaneiosindustria',

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;
        const idEmpresa = configs.getEmpresa().id;

        return {
            empresa      : idEmpresa,
            documento    : '',
            nomedocumento: title,
            numero       : vm.get('valueNumero'),
            pessoa       : vm.get('valueIdPessoa'),
            usuario      : vm.get('valueIdUsuario'),
            inicio       : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final        : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem        : vm.get('valueOrdem'),
            status       : vm.get('valueStatus')
        };
    },

    afterLoadMainStore: function(store, records, success, operation) {
        this.getViewModel().set('forceTotais', new Date());        
        this.getView().down('grid').getSelectionModel().deselectAll();                
    },

    onSelectionChange: function (selModel, records) {

        const view                   = this.getView();        
        const movimentosSelecionados = view.down('grid').getSelectionModel().getSelection();

        const valorTotalSelecionado = movimentosSelecionados.reduce((result, movimento) => {
            return result + cents(movimento.get('MOVIMENTOS_TOTAL'));
        }, 0) / 100;

        const totalMascara = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(valorTotalSelecionado);

        this.getViewModel().set('movimentosSelecionados', movimentosSelecionados.length.toString() || '0');
        this.getViewModel().set('totalSelecionado', totalMascara);
    },

    onImprimirClick: async function () {
        const view = this.getView();
        const vm = this.getViewModel();

        const listaImpressao = view.down('grid').getSelectionModel().getSelection();

        if((listaImpressao || []).length == 0) {
            Ext.Note('warning', 'Selecione pelo menos um documento para imprimir');
            return;
        }

        try {
            this.getView().initGauge('Gerando impressão...');

            const idsParaImpressao = listaImpressao
                    .map(movimento => movimento.get('MOVIMENTOS_ID'));               

            const numerosParaImpressao = listaImpressao
                    .map(movimento => movimento.get('MOVIMENTOS_NUMERO'));               

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/ordemcarregamento`,
                method: 'POST',
                data: {
                    empresa     : configs.getEmpresa().id,
                    empresacnpj : configs.getEmpresa().cnpj,       
                    usuario     : vm.get('valueIdUsuario'),
                    ids         : idsParaImpressao,
                    numeros     : numerosParaImpressao
                }
            });
    
            await SamosUtils.Utils.sleep(1000);
    
            this.getView().stopGauge();

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

        this.getView().stopGauge();
    },


});
