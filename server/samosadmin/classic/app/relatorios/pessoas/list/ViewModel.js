Ext.define('SamosAdmin.relatorios.pessoas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.relatoriospessoaslist',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: '',
            valueFinal : '',
            valueTipo  : 0, // Padrão - Todos
            valueOrdem : 0, // Padrão - Nome
            valueStatus: 0  // Padrão - Ativos
        }),

        this.setFormulas({
            hideFiltros: function (get) {
                return false;
            },

            hideImprimir: function (get) {
                return false;
            }
        });
        
    }    
});
