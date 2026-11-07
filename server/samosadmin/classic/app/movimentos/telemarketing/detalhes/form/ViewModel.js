Ext.define('SamosAdmin.movimentos.telemarketing.detalhes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formdetalhestelemarketing',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({

            hideNovo: function(get) {
                const permissaoForm = Ext.$('formtelemarketing')[0].getPermissoes();                
                return permissaoForm.lockNovo || !get('readOnly');;
            },

            hideAlterar: function(get) {
                const permissaoForm = Ext.$('formtelemarketing')[0].getPermissoes();                
                return permissaoForm.lockAlterar || !get('readOnly');
            },

            hideExcluir: function(get) {
                const permissaoForm = Ext.$('formtelemarketing')[0].getPermissoes();                
                return permissaoForm.lockExcluir || !get('readOnly');
            },

            hideSair : function (get) {
                return false;
            },

            hideGravar: function (get) {
                return get('readOnly');
            },

            hideSair: function (get) {
                return !get('readOnly');
            }

        });
    }
});
