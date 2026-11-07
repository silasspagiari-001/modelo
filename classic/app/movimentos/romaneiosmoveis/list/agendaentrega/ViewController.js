Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.agendaentrega.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.romaneiosmoveisagendaentrega',

    getServerUrl: function() {
        return 'server/agendaromaneioentrega';
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
            xtype: 'romaneiosmoveisagendaentregaform',
            permissoes: this.getView().getPermissoes()
        });

        view.getViewModel().set({
            model: record,
            readOnly: true,
            temMontagem: cents(record.get('MONTAGENS_VALOR')) > 0
        });
    },

    onImprimirClick: async function(){
        const view = this.getView();
        const pedidos = view.down('grid').getSelectionModel().getSelection();
        const temImpressos = pedidos.some(impresso => impresso.get('MOVIMENTOS_PROTOCOLO') == 'ENTREGA');

        if(
            configs.getMovimentos().senhaImpressao && 
            temImpressos
        ) {
            const nivel = 3; 
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
                    url: `/relatorios/${configs.getClientName()}/comprovanteentregamoveis`,
                    method: 'GET',
                    query: {
                        id: pedidos.map(pedido => pedido.get('MOVIMENTOSITENS_ID_MOVIMENTOS')).join(',')   
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

                this.onSairClick();                        
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    }
});