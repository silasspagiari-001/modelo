Ext.define('SamosAdmin.processos.alterardocumentos.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.processosalterardocumentos',

    getServerUrl: function() {
        return 'server/movimentos';
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            numero        : vm.get('valueNumero'),
            empresa       : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            pessoa        : vm.get('valueIdPessoa'),
            documento     : '',
            nomedocumento : vm.get('valueDocumento'),
            operacao      : vm.get('valueDocumento') == 'Orçamentos'  ? '400000' :
                            vm.get('valueDocumento') == 'Pedidos'     ? '500000' :
                            vm.get('valueDocumento') == 'Requisições' ? '600000' : '',
            filtravendedor: (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
            movimentosnome: vm.get('valuePessoa'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            tipo          : 0,            
            ordem         : 0//Emissão
            //status        : 1 //Não Faturada
        };
    },

    afterLoadMainStore: function(store, records, success, operation) {
        const valorTotal = records.reduce((total, movimento) => total += cents(movimento.get('MOVIMENTOS_TOTAL')), 0);
        let maskTotal = '';

        if(parseFloat(valorTotal) > 0) {
            maskTotal = Ext.util.Format.MoneyMask.setMask('Total: R$ #9.999.990,00').mask(valorTotal / 100)
        }

        this.getViewModel().set('totalGeral', maskTotal);
    },

    onSelectionChange: function (selModel, records) {
        const valorTotal = records.reduce((total, movimento) => total += cents(movimento.get('MOVIMENTOS_TOTAL')), 0);
        let maskTotal = '';

        if(parseFloat(valorTotal) > 0) {
            maskTotal = Ext.util.Format.MoneyMask.setMask('Selecionado: R$ #9.999.990,00').mask(valorTotal / 100)
        }

        this.getViewModel().set('totalSelecionado', maskTotal);
    },

    onEfetivarClick: async function() {
        const view = this.getView();
        
        try {
            const documentos = view.down('grid').getSelectionModel().getSelection();
            const novaEmissao = momentTz(this.lookup('novaemissao').getValue()).format('YYYY-MM-DD')

            if(!novaEmissao){
                throw 'Selecione a nova emissão';
            }

            if(
                moment(novaEmissao, 'YYYY-MM-DD').isAfter(moment().endOf('month')) ||
                moment(novaEmissao, 'YYYY-MM-DD').isBefore(moment().startOf('month'))
            ) {
                throw 'A nova emissão precisa estar dentro do mês atual';
            }
            
            if(documentos.length == 0){
                throw 'Selecione as requisições';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente efetivar?')){
                view.initGauge('Efetivando...'); 

                await SamosUtils.Request.nodeApi({
                    url   : `/processos/movimentos/alterardocumentos`,
                    method: 'POST',
                    data  : {
                        ids: documentos.map(r => r.get('MOVIMENTOS_ID')),
                        novaemissao: novaEmissao
                    }
                });

                Ext.Note('success', 'Requisições alteradas com sucesso');
                this.onBuscarClick();
            }       
        } catch(error) {
            console.log(error)
            SamosUtils.Msg.error(error, 'Falha ao alterar requisições');
        }

        view.stopGauge(); 
    },

    onImprimirClick: async function() {
        const view = this.getView();
        const vm = this.getViewModel();

        try {
            const documentos = view.down('grid').getSelectionModel().getSelection();
    
            if(!documentos[0]){
                throw 'Selecione o(s) documento(s)';
            }          
            
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/alterardocumentos`,
                    method: 'POST',
                    data: {
                        ids: documentos.map(r => r.get('MOVIMENTOS_ID')),
                        nomedocumento: vm.get('valueDocumento'),
                        produtos: vm.get('valueProdutos')
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir relação de documentos');
        }

        view.stopGauge();
    }
});