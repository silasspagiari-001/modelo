Ext.define('SamosAdminModern.orcamentos.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.orcamentosform',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            status: function(get) {
                return { 
                    'N': 'Não Faturado',
                    'M': 'Não Faturado',
                    'F': 'Faturado',
                    'E': 'Faturado',
                    'C': 'Cancelado',
                    'B': 'Cancelado'
                }[
                    get('model.MOVIMENTOS_STATUS')
                ]
            },

            valorProdutos: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_PRODUTOS'));
            },

            valorPartida: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_IMPOSTO'));
            },

            valorPercentual: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_PERCENTUAL'));
            },

            valorDescontos: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_DESCONTOS'));
            },

            valorDespesas: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_DESPESAS'));
            },

            valorTotal: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_TOTAL'));
            },

            modelNumero: function(get) {
                var idProperty = get('model').getIdProperty ? get('model').getIdProperty() : '',
                    numeroProperty = idProperty.split('_')[0] + '_NUMERO',
                    force = get('forceChangeId'),
                    numero = get('model').get ? get('model').get(numeroProperty) : '';

                return !numero ? '******' : numero;
            }
        });
    }
});
