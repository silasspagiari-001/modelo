Ext.define('SamosAdmin.relatorios.comprasicmsfrete.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscomprasicmsfretelist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueEmpresa: '',
            valueFornecedor: '',
            valueIdEmpresa : '',
            valueIdPessoa  : '',
            valueInicio    : momentServer().subtract(3, 'months').format('YYYY-MM-DD'),
            valueFinal     : momentServer().subtract(1, 'day').format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
