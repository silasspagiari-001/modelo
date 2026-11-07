Ext.define('SamosAdmin.relatorios.controlevacinas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscontrolevacinaslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir : false,
            valueInicio  : momentServer().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
            valueFinal   : momentServer().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
            valueNota    : 0            
        });
    }
});
