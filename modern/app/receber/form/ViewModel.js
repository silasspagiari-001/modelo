Ext.define('SamosAdminModern.receber.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.receberform',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            status: function(get) {
                return { 
                    'A': 'Aberto',
                    'P': 'PAGO'
                }[
                    get('model.FINANCEIROS_STATUS')
                ]
            },

            valorDescontos: function(get) {
                return Ext.util.Format.currency(get('model.FINANCEIROS_DESCONTOS'));
            },

            valorTaxas: function(get) {
                return Ext.util.Format.currency(get('model.FINANCEIROS_TAXAS'));
            },

            valorJuros: function(get) {
                return Ext.util.Format.currency(get('model.FINANCEIROS_JUROS'));
            },

            valorAberto: function(get) {
                return Ext.util.Format.currency(get('model.FINANCEIROS_ABERTO'));
            },

            valorOriginal: function(get) {
                return Ext.util.Format.currency(get('model.FINANCEIROS_ORIGINAL'));
            },

            valorPago: function(get) {
                return Ext.util.Format.currency(get('model.FINANCEIROS_PAGO'));
            }
        });
    }
});
