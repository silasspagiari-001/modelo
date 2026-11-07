Ext.define('SamosAdmin.relatorios.caixasintetico.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscaixasinteticolist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueOpcao : '2'
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }
});
