Ext.define('SamosAdmin.atualizacao.produtos.form.fotos.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formprodutosfotos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            readOnly: true,
            hideDescricao: !configs.getUsuario().privilegiado,            
            hideVisualizar: false,
            hideBaixar: false,
            hideExcluir: !configs.getUsuario().privilegiado,
            hideCarregar: !configs.getUsuario().privilegiado,
            hideSair: false
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.produtos.form.fotos.Model',
                autoLoad: true,
                pageSize: 9999,
                proxy: {
                    type: 'nodejsrest',
                    url: 'server/produtosfotos',
                    extraParams: {
                        idProduto: '{idProduto}'
                    }
                }
            }
        });
    }
});
