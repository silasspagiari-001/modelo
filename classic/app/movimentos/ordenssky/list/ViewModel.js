Ext.define('SamosAdmin.movimentos.ordenssky.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.ordenssky',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: '10'
        });

        this.setFormulas({
            isTecnico: function(get) {
                return configs.getUsuario().tipo == '2';
            },

            hideRecebidas: function(get) {
                return get('isTecnico');
            },

            hideRotas: function(get) {
                return get('isTecnico');
            },

            hideAvanco: function(get) {
                return get('isTecnico');
            },

            hideSincronizarOS: function(get) {
                return get('isTecnico');
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
