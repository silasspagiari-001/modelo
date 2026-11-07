Ext.define('SamosAdmin.relatorios.estoque.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosestoquelist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueEstoque  : 0,
            valueOrdem    : 0,
            valueStatus   : 2,
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal: momentServer().endOf('month').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }

});
