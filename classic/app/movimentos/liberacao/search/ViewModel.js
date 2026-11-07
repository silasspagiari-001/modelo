Ext.define('SamosAdmin.movimentos.liberacao.search.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel',
    alias: 'viewmodel.liberacaosearch',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            hideLiberar: false,
            hideRecusar: false,
            hideSair: false
        });

        this.setFormulas({
            dataObj: function (get) {
                var data = SamosUtils.Json.tryJsonToObj(get('memoryStore')) || '';

                if(data) {
                    this.getStore('main').setData(data);
                }
            }
        });
    }
});
