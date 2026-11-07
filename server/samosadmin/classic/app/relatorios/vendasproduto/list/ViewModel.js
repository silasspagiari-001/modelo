Ext.define('SamosAdmin.relatorios.vendasproduto.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendasprodutolist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueGrupo     : '',
            valueFornecedor: '',
            valueIdGrupo   : '',
            valueIdPessoa  : '',
            valueInicio    : momentServer().subtract(3, 'months').format('YYYY-MM-DD'),
            valueFinal     : momentServer().subtract(1, 'day').format('YYYY-MM-DD'),
            valueTipo      : 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
