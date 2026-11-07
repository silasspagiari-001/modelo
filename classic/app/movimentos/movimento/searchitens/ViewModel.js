Ext.define('SamosAdmin.movimentos.movimento.searchitens.ViewModel', {
    extend: 'SamosWidgets.search.ViewModel', 
    alias: 'viewmodel.movimentositenssearch',

    constructor: function () {
        this.callParent(arguments); 

        this.setFormulas({
            dataObj: function (get) {
                var data = SamosUtils.Json.tryJsonToObj(get('memoryStore.data')) || '';

                if(data) {
                    this.getStore('main').setData(data);
                    setTimeout(() => {
                        this.getView().down('grid').getSelectionModel().selectAll();
                    }, 200);
                }
            }
        });

        this.setStores({
            main: {
                type: 'nodejsstore',
                proxy: {
                    type: 'memory'
                }
            }
        });
    }
});
