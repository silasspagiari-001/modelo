Ext.define('SamosAdmin.movimentos.ordensacomtf.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.ordensacomtf',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().format('DD/MM/YYYY'),
            valueOrdem: 0,
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
