Ext.define('SamosAdmin.relatorios.movimentoscfop.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosmovimentoscfoplist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdPessoa  : '',
            valueCfopa     : '',
            valueCfopb     : '',            
            valueInicio    : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal     : momentServer().endOf('month').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
