Ext.define('SamosAdmin.movimentos.ordenssky.list.recebidas.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.ordensskyrecebidas',

    initViewModel: function() {
        setTimeout(() => {
            this.onBuscarClick();
        }, 500);
    },

    getServerUrl: function() {
        return 'server/ordenssky/consultas/recebidas';
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            empresa : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            numero  : vm.get('valueNumero'),
            conteudo: vm.get('valueConteudo'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final   : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem   : vm.get('valueOrdem'),
            status  : 'A'
        };
    },

    onItemDblClick: Ext.emptyFn
});
