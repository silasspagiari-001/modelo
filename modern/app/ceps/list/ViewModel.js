Ext.define('SamosAdminModern.ceps.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.ceps',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: '',
            valueCidade  : configs.getEmpresa().cidade,
            valueEstado  : configs.getEmpresa().estado,
            valueOrdem   : 0
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.ceps.Model',
                proxy: {
                    url: 'server/consultas/ceps'
                }
            }
        })
    }
});
