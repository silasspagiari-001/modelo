Ext.define('SamosAdmin.processos.entradas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.processosentradas',

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;

        return {
            numero        : vm.get('valueNumero'),
            empresa       : configs.getEmpresa().id,
            pessoa        : vm.get('valueIdPessoa'),
            lote          : vm.get('valueIdLote'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem         : vm.get('valueOrdem')
        };
    }

});
