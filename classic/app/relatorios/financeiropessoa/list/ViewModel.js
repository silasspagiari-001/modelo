Ext.define('SamosAdmin.relatorios.financeiropessoa.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriosfinanceiropessoalist',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valueTipo         : '0',
            valueStatus       : 0,
            valueEmiinicio    : momentServer().subtract(5, 'years').format('DD/MM/YYYY'),
            valueEmifinal     : momentServer().endOf('month').format('DD/MM/YYYY'),
            valueVctinicio    : momentServer().subtract(5, 'years').format('DD/MM/YYYY'),
            valueVctfinal     : momentServer().endOf('year').add(2, 'years').format('DD/MM/YYYY')
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
