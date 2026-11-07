Ext.define('SamosAdmin.atualizacao.montagens.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.montagens',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }
    
});
