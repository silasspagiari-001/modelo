Ext.define('SamosAdmin.movimentos.ordenssky.list.rotas.associadas.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.ordensskyrotasassociadas',

    initViewModel: function(vm) {
        if(vm.get('rota')) {
            this.onBuscarClick();
        } else {
            setTimeout(() => {
                this.initViewModel(vm);
            }, 500);
        }
    },

    getServerUrl: function() {
        return 'server/ordenssky/consultas/associadas';
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            rota: vm.get('rota')
        };
    },

    onItemDblClick: Ext.emptyFn
});
