Ext.define('SamosAdminModern.notificacao.list.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.notificacao',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueConteudo: '',
            valueInicio  : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal   : momentServer().format('YYYY-MM-DD'),
            valueStatus  : 6
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdminModern.notificacao.Model',
                proxy: {
                    url: 'server/notificacao'
                }
            }
        })
    }
});
