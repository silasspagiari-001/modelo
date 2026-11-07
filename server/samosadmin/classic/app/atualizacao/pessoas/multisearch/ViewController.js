Ext.define('SamosAdmin.atualizacao.pessoas.multisearch.ViewController', {
    extend: 'SamosWidgets.multisearch.ViewController',
    alias: 'controller.pessoasmultisearch',

    onSelecionarClick: function(btn, e) {
        this.finalizarSelecao();
    },

    onSelectionChange: function(){
        this.getViewModel().set('forceTotais', new Date());
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
