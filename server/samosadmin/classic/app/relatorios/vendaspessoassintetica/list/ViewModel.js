Ext.define('SamosAdmin.relatorios.vendaspessoassintetica.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosvendaspessoassinteticalist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            hideImprimir    : false,
            valueInicio     : momentServer().startOf('month').format('YYYY-MM-DD'),
            valueFinal      : momentServer().endOf('month').format('YYYY-MM-DD'),
            valueIdPessoai  : 1,
            valueIdPessoaf  : 999999,
            valueIdUsuario  : 0,
            valueIdGrupo    : 0,
            valueDocumento  : '3',
            valueVacina     : '2',
            valuePRP        : '2',
            valueStatus     : '0'
        });

        this.setFormulas({
            hideVacina: function (get) {
                return !configs.getProdutos().vacinas
            }
        });

    }
});
