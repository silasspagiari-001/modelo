Ext.define('SamosAdminModern.notaeletronica.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.notaeletronica',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: '',
            valueStatus  : 6,
            valueOrdem   : 0,
            valueInicio  : momentServer().format('YYYY-MM-DD'),
            valueFinal   : momentServer().format('YYYY-MM-DD')
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.notaeletronica.Model',
                proxy: {
                    url: 'server/movimentos'
                }
            }
        })
    }
});
