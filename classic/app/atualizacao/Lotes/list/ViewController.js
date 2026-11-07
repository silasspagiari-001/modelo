Ext.define('SamosAdmin.atualizacao.lotes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.lotes',

    getBuscarParams: function () {
        var vm = this.getViewModel();
        
        return {
            conteudo: vm.get('valueConteudo'),
            empresa : configs.getEmpresa().id,
            produto: vm.get('valueIdProduto'),
            inicio  : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final   : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
            ordem: vm.get('valueOrdem'),
            status: vm.get('valueStatus'),

        }; 
    }

});
