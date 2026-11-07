Ext.define('SamosAdmin.processos.entradas.list.ViewModel', {
    extend: 'SamosModule.list.ViewModel',
    alias: 'viewmodel.processosentradas',

    constructor: function () {
        this.callParent(arguments);

        this.setData({
            valueInicio: momentServer().startOf('month').format('YYYY-MM-DD')
        });

        this.setFormulas({

            nomePessoa: function(get) {                
                return get('gridprocessosentradas.selection.MOVIMENTOS_NOME');
            }
            
        });

    }    
    
});
