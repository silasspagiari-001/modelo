Ext.define('SamosAdmin.atualizacao.veiculos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.veiculos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }

});
