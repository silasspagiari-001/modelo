Ext.define('SamosAdmin.relatorios.extrato.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosextratolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdPortador: '',
            valueTipo  : 0,
            valueStatus: 2,
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
