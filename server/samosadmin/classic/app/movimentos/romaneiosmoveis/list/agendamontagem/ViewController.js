Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendamontagem.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.romaneiosmoveisagendamontagem',

    getServerUrl: function() {
        return 'server/agendaromaneiomontagem';
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            empresa : configs.getEmpresa().id,
            pessoa  : vm.get('valueIdPessoa'),
            numero  : vm.get('valueNumero'),            
            inicio  : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
            final   : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
            turno   : vm.get('valueTurno'),
            situacao: vm.get('valueSituacao')
        };
    },

    onItemDblClick: function (grid, record) {
        const view = Ext.create({
            xtype: 'romaneiosmoveisagendamontagemform',
            permissoes: this.getView().getPermissoes()
        });

        view.getViewModel().set({
            model: record,
            readOnly: true
        });
    },

    onImprimirClick: async function(){
        const view = this.getView();
        const pedidos = view.down('grid').getSelectionModel().getSelection();
        const temImpressos = pedidos.some(pedido => pedido.get('MOVIMENTOS_NFE') == 'MOP');
        const temAbatidos = pedidos.some(pedido => pedido.get('MOVIMENTOS_NFE') == 'ABA');

        if(configs.getClientName == 'prudenmoveis' && temAbatidos) {
            Ext.Note('warning', 'Revise a seleção - Há pedido em que a montagem foi abatida');
            return;
        }

        if(
            configs.getMovimentos().senhaImpressao && 
            temImpressos
        ) {
            const nivel = (this.getViewModel().get('isPedido') ? 1 : 3);
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {
            if(!pedidos[0]){
                throw 'Selecione o(s) pedidos(s)';
            }

            delete this.permiteImpressao;            

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/comprovantemontagemmoveis`,
                    method: 'GET',
                    query: {
                        id: pedidos.map(pedido => pedido.get('MOVIMENTOSITENS_ID_MOVIMENTOS')).join(',')
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

                this.onBuscarClick.call(this);                           
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }
        
        view.stopGauge();
    }
});
