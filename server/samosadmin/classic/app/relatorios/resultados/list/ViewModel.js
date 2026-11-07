Ext.define('SamosAdmin.relatorios.resultados.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosresultadoslist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueStatus: 0,
            valueOrdem : 2,
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal : momentServer().format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideImprimir: function(get){
                return false;
            }
        });
    }

});
