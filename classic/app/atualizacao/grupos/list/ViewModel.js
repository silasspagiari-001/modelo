Ext.define('SamosAdmin.atualizacao.grupos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.grupos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: configs.getClientName() == 'prudenmoveis' ? 2 : 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

    }

});
