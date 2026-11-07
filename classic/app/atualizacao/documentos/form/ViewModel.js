Ext.define('SamosAdmin.atualizacao.documentos.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formdocumentos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideExcluir: function(get) {
                return true;
            }
        });
    }
});
