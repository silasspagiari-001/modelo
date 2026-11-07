Ext.define('SamosAdmin.atualizacao.empresas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.empresas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: 4,
            valueStatus: 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }    

});
