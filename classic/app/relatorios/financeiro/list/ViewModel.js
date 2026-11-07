Ext.define('SamosAdmin.relatorios.financeiro.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosfinanceirolist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueTipo         : '0',
            valueDocumento    : 0,            
            valueStatus       : 0,
            valueOrdem        : 2,
            valueQuebra       : 'false',
            valueSemnn        : 'false',
            valueRelirf       : 'false',
            valueEmiinicio    : configs.getClientName() == 'eleve' ? momentServer().startOf('month').format('DD/MM/YYYY') : momentServer().subtract(2, 'years').format('DD/MM/YYYY'),
            valueEmifinal     : momentServer().endOf('month').format('DD/MM/YYYY'),
            valueVctinicio    : configs.getClientName() == 'eleve' ? momentServer().startOf('month').format('DD/MM/YYYY') : momentServer().subtract(2, 'years').format('DD/MM/YYYY'),
            valueVctfinal     : momentServer().endOf('year').add(     2, 'years').format('DD/MM/YYYY'),
        }),

        this.setFormulas({
            hideFiltros: function (get) {
                return false;
            },

            hideImprimir: function(get){
                return false;
            }
        });
    }
});
