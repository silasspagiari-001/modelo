Ext.define('SamosAdmin.atualizacao.portadores.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.portadoressearch',

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa : configs.getEmpresa().id,
            conteudo: vm.get('valueConteudo'),
            ordem   : vm.get('valueOrdem'),
            status  : vm.get('valueStatus')
        };
    }        
});
