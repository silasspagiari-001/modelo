Ext.define('SamosAdmin.relatorios.comissoespro.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscomissoesprolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal  : momentServer().endOf('month').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
