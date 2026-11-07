Ext.define('SamosAdmin.relatorios.pessoas.filtro.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.formpessoasfiltro',

    onFiltrarClick: async function(btn, e) {
        const listPessoas = Ext.$('relatoriospessoaslist')[0] || [];

        listPessoas.getViewModel().set({
            valueRelacionar : this.lookup('relacionar').getValue(),
            valueDataini    : this.lookup('datainicio').getValue(), 
            valueDatafin    : this.lookup('datafinal').getValue()
        });
        this.onSairClick();
    }
        
});
