Ext.define('SamosAdmin.relatorios.compras.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscompraslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueEmpresa   : '',            
            valueGrupo     : '',
            valueFornecedor: '',
            valueIdEmpresa : '',
            valueIdGrupo   : '',
            valueIdPessoa  : '',
            valueInicio    : momentServer().subtract(3, 'months').format('YYYY-MM-DD'),
            valueFinal     : momentServer().subtract(1, 'day').format('YYYY-MM-DD'),
            valueMeses     : 1,
            valueTipo      : 1
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
