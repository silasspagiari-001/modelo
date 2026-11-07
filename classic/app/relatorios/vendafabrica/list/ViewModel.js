Ext.define('SamosAdmin.relatorios.vendafabrica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendafabricalist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa: '',
            valueEmpresa: '',
            valueIdGrupoi  : 1,
            valueIdGrupof  : 999999,
            valueIdPessoai : '',
            valuePessoai: '',
            valuePessoaf: '',
            valueIdPessoaf : '',
            valueInicio    : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal     : momentServer().format('YYYY-MM-DD'),
            valueDocumento : 0
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
