Ext.define('SamosAdmin.relatorios.pessoas.filtro.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formpessoasfiltro',
 
    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideFiltrar: function(get) {
                return false;
            },

            hideSair: function(get) {
                return false;
            }
        });
    }
});
