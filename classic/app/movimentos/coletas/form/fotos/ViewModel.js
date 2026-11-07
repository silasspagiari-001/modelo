Ext.define('SamosAdmin.movimentos.coletas.form.fotos.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.formcoletasfotos',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            readOnly: true,
            hideVisualizar: false,
            hideBaixar: false,
            hideExcluir: !configs.getUsuario().privilegiado,
            hideCarregar: !configs.getUsuario().privilegiado,
            hideSair: false
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.movimentos.coletas.form.fotos.Model',
                autoLoad: true,
                pageSize: 9999,
                proxy: {
                    type: 'nodejsrest',
                    url: 'server/coletasfotos',
                    extraParams: {
                        idColeta: '{idColeta}'
                    }
                }
            }
        });
    }
});
