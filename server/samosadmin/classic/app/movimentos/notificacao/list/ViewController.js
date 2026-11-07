Ext.define('SamosAdmin.movimentos.notificacao.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.notificacao',

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final   : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
            ordem   : vm.get('valueOrdem'),
            status  : vm.get('valueStatus')
        };
    },
});
