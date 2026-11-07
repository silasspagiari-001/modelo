Ext.define('SamosAdmin.atualizacao.lotes.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.lotessearch',

    getBuscarParams: function () {
        const vm = this.getViewModel();
        
        return {
            conteudo: vm.get('valueConteudo'),
            empresa : configs.getEmpresa().id,
            produto : vm.get('valueIdProduto'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final   : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
            ordem   : vm.get('valueOrdem'),
            status  : vm.get('valueStatus')
        }; 
    },    

    onItemDblClick: async function (grid, record) {
        const view = this.getView();

        try {
            const txt = view.txt;
            const visible = view.isVisible(true);
                              
            this.callParent(arguments);
    
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao selecionar o lote');
        }

        view.stopGauge();
    }

});
