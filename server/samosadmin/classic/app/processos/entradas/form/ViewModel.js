Ext.define('SamosAdmin.processos.entradas.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formprocessosentradas',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            
            hideAlterar: function(get) {
                return get('updating')
            },

            isSemLote: function(get) {
                return get('model.PRODUTOS_DERIVADO').match(/T|F/);
            },            

            isSaida: function(get) {
                return get('model.OPERACOES_ESTOQUE') == 'D';
            },            

            disableGravar: function(get) {
                return !get('model.PRODUTOS_NOME');
            }
            
        });
    }
});

