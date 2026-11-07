Ext.define('SamosAdminModern.produtos.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.produtos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: '',
            valueOrdem: configs.getProdutos().ordemBusca
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.produtos.Model',
                proxy: {
                    url: 'server/consultas/precoproduto'
                }
            }
        })
    }
});
