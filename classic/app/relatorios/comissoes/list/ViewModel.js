Ext.define('SamosAdmin.relatorios.comissoes.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatorioscomissoeslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueIdEmpresa: '',
            valueInicio: momentServer().startOf('month').format('DD/MM/YYYY'),
            valueFinal: momentServer().endOf('month').format('DD/MM/YYYY'),
            valueTipo  : 0 // Padrão Sintético
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});