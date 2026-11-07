Ext.define('SamosAdmin.processos.baixarorcamentos.list.ViewController', { 
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.baixarorcamentos',

    onBuscarClick: async function(btn, e) {
        const txtProduto = this.lookup('produto');
        if(!this.getViewModel().get('valueProduto')) {
            Ext.Note('warning', 'Selecione o produto');
            Ext.defer(txtProduto.focus, 100, txtProduto, [true]);
            return;
        }

        this.callParent(arguments);        

    },

    getServerUrl: function() {
        return 'server/consultas/orcamentos';
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa : configs.getEmpresa().id,
            produto : vm.get('valueCodigo'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final   : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY')
        };
    },


    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            view.initGauge();

            const idItem = record.get('MOVIMENTOSITENS_ID');
            const statusAtual = record.get('MOVIMENTOSITENS_CSTPIS');

            await SamosUtils.Request.nodeApi({
                url   : `/processos/movimentos/baixarorcamento/${idItem}`,
                method: 'PUT',
                data  : {
                    status: statusAtual
                }
            });

            this.onBuscarClick();
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar orçamento');
        }

        view.stopGauge();
    }
});
