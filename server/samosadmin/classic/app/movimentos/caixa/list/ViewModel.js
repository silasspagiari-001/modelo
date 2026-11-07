Ext.define('SamosAdmin.movimentos.caixa.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.caixa',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            statusCaixa: 'undefined',
            valueEmissao: momentServer().format('YYYY-MM-DD'),
            valueCaixa: 'A',
            valueStatus: 2
        });

        this.setFormulas({ 
            hideNovo: function(get) {
                return get('statusCaixa') != 'aberto' && configs.getEmpresa().regimeCaixa;
            },

            hideAbrir: function(get) {
                return get('statusCaixa') == 'aberto' || !configs.getEmpresa().regimeCaixa; 
            },

            hideSangria: function(get) {
                return get('statusCaixa') != 'aberto';
            },

            hideFechar: function(get) {
                return get('statusCaixa') != 'aberto';
            },

            hideCheque: function(get) {
                return get('totalCheque') == '0,00';
            },

            hideImprimir: function(get) {
                const status = get('statusCaixa');
                
                return status != 'aberto' && status != 'fechado';
            }         
        });            
    }
});
