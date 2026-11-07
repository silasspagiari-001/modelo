Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.romaneiosconstrucao',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().startOf('year').subtract(1, 'year').format('DD/MM/YYYY'),
            valueStatus: 0
        });

        this.setFormulas({ 
            hidePendencias: function(get) {
                return false
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
