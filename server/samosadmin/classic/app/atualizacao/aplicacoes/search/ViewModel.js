Ext.define('SamosAdmin.atualizacao.aplicacoes.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.aplicacoessearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueRazao: 0,
            valueTipo: 0,
            valueOrdem: 0
        });
    }
});
