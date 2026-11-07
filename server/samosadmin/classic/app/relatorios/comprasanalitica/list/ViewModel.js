Ext.define('SamosAdmin.relatorios.comprasanalitica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscomprasanaliticalist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueEmpresa   : '',
            valueGrupo     : '',
            valueFornecedor: '',
            valueIdEmpresa : '',            
            valueIdGrupo   : '',
            valueIdPessoa  : '',
            valueItens     : '1',
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
