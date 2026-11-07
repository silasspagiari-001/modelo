Ext.define('SamosAdmin.atualizacao.servicos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.servicos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }

});
