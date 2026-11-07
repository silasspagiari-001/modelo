Ext.define('SamosAdmin.atualizacao.pessoas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.pessoas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueOrdem: configs.getPessoas().ordemBusca,
            valueTipo: configs.getClientName() == 'prudenmoveis' ? 'A' : '0',
            valueCategoria: 'T'
        });
    }
});
