Ext.define('SamosAdminModern.orcamentos.pagamentos.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.orcamentospagamentos',

    constructor: function () {
        this.callParent(arguments);

        this.setFormulas({
            valorDinheiro: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_DINHEIRO'));
            },

            valorDebito: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_DEBITO'));
            },

            valorCheque: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_CHEQUE'));
            },

            valorCredito: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_CREDITO'));
            },

            valorParcelaCredito: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_VLRCREDITO'));
            },

            valorFinanceira: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_FINANCEIRA'));
            },

            valorParcelaFinanceira: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_VLRFINANCEIRA'));
            },

            valorChequePre: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_CHEQUEPRE'));
            },

            valorParcelaChequePre: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_VLRCHEQUEPRE'));
            },

            valorDuplicata: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_DUPLICATA'));
            },

            valorParcelaDuplicata: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_VLRDUPLICATA'));
            },

            valorTransferencias: function(get) {
                return Ext.util.Format.currency(get('pagamento.MOVIMENTOSFORMAS_TRANSFERENCIAS'));
            },

            valorPartida: function(get) {
                return Ext.util.Format.currency(get('model.MOVIMENTOS_IMPOSTO'));
            },

            valorRestante: function(get) {
                const totalMovimento = cents(get('model.MOVIMENTOS_TOTAL'));   

                let totalFormasPagamento = 0;

                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_DINHEIRO'))       || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_TRANSFERENCIAS')) || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_DEBITO'))         || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_CHEQUE'))         || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_CREDITO'))        || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_CHEQUEPRE'))      || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_DUPLICATA'))      || 0;
                totalFormasPagamento += cents(get('pagamento.MOVIMENTOSFORMAS_FINANCEIRA'))     || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOS_BASEICMS'))                 || 0;

                return Ext.util.Format.currency((totalMovimento - totalFormasPagamento) / 100);
            }
        });
    }
});
