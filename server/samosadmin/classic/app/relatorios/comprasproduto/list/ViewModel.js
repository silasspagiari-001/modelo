Ext.define('SamosAdmin.relatorios.comprasproduto.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscomprasprodutolist',

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
            valueTipo      : 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
