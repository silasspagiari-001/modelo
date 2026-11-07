Ext.define('SamosAdmin.relatorios.fiscais.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosfiscaislist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueFiscais: 0,
            valueInicio : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal  : momentServer().endOf('month').format('DD/MM/YYYY'),
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }
});
