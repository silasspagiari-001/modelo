Ext.define('SamosAdmin.relatorios.vendaanalitica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendaanaliticalist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa    : '',
            valueEmpresa      : '',
            valueIdProdutoi   : 1,
            valueIdProdutof   : 999999,
            valueIdGrupoi     : 1,
            valueIdGrupof     : 999999,
            valueIdPessoas    : undefined,
            valueIdUsuarios   : undefined,
            valueProfissional : undefined,
            valueInicio     : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal      : momentServer().format('YYYY-MM-DD'),
            valueDocumento  : 0            
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
