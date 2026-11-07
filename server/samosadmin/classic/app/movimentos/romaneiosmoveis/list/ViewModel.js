Ext.define('SamosAdmin.movimentos.romaneiosmoveis.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.romaneiosmoveis',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueStatus: 3,
            hideAgendamento: false,
            hideBaixaPorLote: false
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
