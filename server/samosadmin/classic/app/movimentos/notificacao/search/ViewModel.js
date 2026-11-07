Ext.define('SamosAdmin.movimentos.notificacao.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.notificacaosearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideMarcarLida: false,
            hideReagendar: false,
            hideSair: false
        });

        this.setFormulas({
            dataObj: function (get) {
                var data = SamosUtils.Json.tryJsonToObj(get('memoryStore')) || '';

                if(data) {
                    this.getStore('main').setData(data);
                }
            }
        });/*

        this.setStores({
            main: {
                type: 'nodejsstore',
                model: 'SamosAdmin.movimentos.notificacao.Model',
                proxy: {
                    type: 'memory'
                }
            }
        });*/
    }
});
