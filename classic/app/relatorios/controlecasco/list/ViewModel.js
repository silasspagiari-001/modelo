Ext.define('SamosAdmin.relatorios.controlecasco.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscascolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueDocumento   : 2,
            valueStatus      : 'E',
            valueCasco       : 'S',
            valueOrdem       : 0,
            valueInicio      : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal       : momentServer().endOf('month').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});