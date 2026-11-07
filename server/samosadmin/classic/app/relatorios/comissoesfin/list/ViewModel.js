Ext.define('SamosAdmin.relatorios.comissoesfin.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscomissoesfinlist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueEmissao: configs.getClientName() == 'lislais'? momentServer().subtract(1, 'year').format('DD/MM/YYYY') : momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal: momentServer().format('DD/MM/YYYY'),
            valuePeriodo: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueAte: momentServer().endOf('month').format('DD/MM/YYYY'),
            valueTipo  : 0, // Padrão - Sintético
            valueOrdem : 1, // Padrão - Pagamento
            valueStatus: 0  // Padrão - pagos
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});
