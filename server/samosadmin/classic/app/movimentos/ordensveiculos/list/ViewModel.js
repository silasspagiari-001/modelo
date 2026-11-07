Ext.define('SamosAdmin.movimentos.ordensveiculos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.ordensveiculos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueStatus: 'T'

        });

        this.setFormulas({
            hideExportar: function(get) {
                return get('isMontador');
            }
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
