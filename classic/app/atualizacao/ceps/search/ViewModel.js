Ext.define('SamosAdmin.atualizacao.ceps.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.cepssearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueCidade: configs.getPermissao()['CIDADES_NOME'],
            valueEstado: configs.getPermissao()['CIDADES_ESTADO']
        });
    }
});
