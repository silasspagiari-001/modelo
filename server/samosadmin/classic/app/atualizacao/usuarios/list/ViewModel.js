Ext.define('SamosAdmin.atualizacao.usuarios.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.usuarios',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });

        this.setData({
            valueTipo: '',
            valueStatus: '0'
        });
    }
});
