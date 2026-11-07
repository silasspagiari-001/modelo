Ext.define('SamosAdmin.relatorios.demonstrativo.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosdemonstrativolist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueEmpresa: '',
            valueIdEmpresa: '',
            valueTipo: 0,
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal : momentServer().format('YYYY-MM-DD')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }

});