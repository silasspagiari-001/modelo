Ext.define('SamosAdmin.atualizacao.lotes.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formlotes',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function (get) {
                return get('updating');
            }
        });

    }    

});
