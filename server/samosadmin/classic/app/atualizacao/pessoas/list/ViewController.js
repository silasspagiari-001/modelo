Ext.define('SamosAdmin.atualizacao.pessoas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.pessoas',

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            conteudo: vm.get('valueConteudo'),
            ordem: vm.get('valueOrdem'),
            tipo: vm.get('valueTipo'),
            status: vm.get('valueStatus'),
            propriedades: configs.getPessoas().propriedades,
            assistencias: configs.getPessoas().assistencias,
            categoria: vm.get('valueCategoria')
        };
    },

    afterLoadMainStore: async function(store, records, success, operation) {
        const view = this.getView().down('grid tableview');
        const tipos = configs.getPessoas().tipos;

        records.forEach((record, index) => {
            const tipo = tipos.find(list => list[0] == record.get('PESSOAS_TIPO'))
            if (tipo) {
                view.getRow(index).style.color = tipo[2] || 'black';
            }
        })
    }
});
