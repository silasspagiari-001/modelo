Ext.define('SamosAdmin.movimentos.encomendas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.encomendas',

    constructor: function () {
        this.callParent(arguments);

        const title = this.getView().title;

        this.setData({
            valueInicio: momentServer().format('YYYY-MM-DD'),
            valueStatus: 2
        });

        this.setStores({
            documentos: {
                type: 'nodejsstore',
                model: 'SamosAdmin.atualizacao.documentos.Model',
                proxy: {
                    url: 'server/documentos',
                    extraParams: {
                        ordem: 2,
                        status: 2,
                        start: 0,
                        limit: 9999
                    }
                }
            }
        });
    }
});
