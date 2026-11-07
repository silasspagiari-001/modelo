Ext.define('SamosAdmin.relatorios.faturamento.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosfaturamentolist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueFaturamento: 0,
            valueTipo: 0,
            valueOrdem: 0,
            valueInicio : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal  : momentServer().endOf('month').format('DD/MM/YYYY')
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }

});
