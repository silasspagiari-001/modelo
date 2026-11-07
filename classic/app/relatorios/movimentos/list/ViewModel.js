Ext.define('SamosAdmin.relatorios.movimentos.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosmovimentoslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: configs.getClientName() == 'stilomoveis' ? 
                         momentServer().startOf('month').format('YYYY-MM-DD') : 
                         moment().format('YYYY-MM-DD'),
            valueFinal: moment().format('YYYY-MM-DD'),
            valuePessoa: '',
            valueDocumento: 3, 
            valueOperacao: 0, 
            valueStatus: 0, 
            valueOrdem: 0,
            valueIdPessoa: undefined,
            valueStatus: 'E'
        });

        this.setFormulas({
            hideImprimir: function (get) {
                return false;
            }
        });
    }    
});