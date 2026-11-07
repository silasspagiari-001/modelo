Ext.define('SamosAdmin.movimentos.coletas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.coletas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: 1,
            valueIdUsuario: configs.getUsuario().id,
            valueUsuario: configs.getUsuario().nome
        });

    } 
});
