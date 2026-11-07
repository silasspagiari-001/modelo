Ext.define('SamosAdmin.movimentos.movimento.form.formaspagamento.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentosformaspagamento',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideAlterar: function(get) {
                const vmMovimento = Ext.$('formmovimentos')[0].getViewModel();

                return get('updating') || 
                       (
                           vmMovimento.get('model.MOVIMENTOS_SERIEORIGEM') == 'PED' &&
                           vmMovimento.get('model.MOVIMENTOS_FORMASPAGAMENTO')      &&
                           vmMovimento.get('model.MOVIMENTOS_FORMASPAGAMENTO')[0]
                       );
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                
                return get('readOnly') ||
                       get('isFaturado') ||
                       !get('movimento.MOVIMENTOS_NUMERO') ||
                       !formMovimento.getViewModel().get('readOnly');
            },

            hideSair: function (get) {
                return !get('isFaturado');
            },

            hideCancelar: function (get) {
                return get('isFaturado');
            },

            disableConfirmar: function(get) {
                return get('valorRestante') != 0;
            },

            disableGravar: function(get) {
                return get('valorRestante') != 0;
            },

            valorRestante: function(get) {
//                const totalMovimento = get('totalOriginal'); // antes
                const totalMovimento = cents(get('movimento.MOVIMENTOS_TOTAL'));//forçar                

                let totalFormasPagamento = 0;

                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_DINHEIRO'))       || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_TRANSFERENCIAS')) || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_DEBITO'))         || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_CHEQUE'))         || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_CREDITO'))        || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_CHEQUEPRE'))      || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_DUPLICATA'))      || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOSFORMAS_FINANCEIRA'))     || 0;
                totalFormasPagamento += cents(get('model.MOVIMENTOS_VALORIPI'))             || 0;

                return (totalMovimento - totalFormasPagamento) / 100;
            },

            novoValor: function(get) {
                get('movimento.MOVIMENTOS_TOTAL');//forçar

                let totalFormasPagamento = 0;
                const dinheiro            = cents(get('model.MOVIMENTOSFORMAS_DINHEIRO'));
                const creditopessoa       = cents(get('model.MOVIMENTOS_VALORIPI'));
                const transferencia       = cents(get('model.MOVIMENTOSFORMAS_TRANSFERENCIAS'));
                const debito              = cents(get('model.MOVIMENTOSFORMAS_DEBITO'));
                const cheque              = cents(get('model.MOVIMENTOSFORMAS_CHEQUE'));

                // valor Total
                const credito             = cents(get('model.MOVIMENTOSFORMAS_CREDITO'));
                const carne               = cents(get('model.MOVIMENTOSFORMAS_DUPLICATA'));
                const chequePre           = cents(get('model.MOVIMENTOSFORMAS_CHEQUEPRE'));
                const financeira          = cents(get('model.MOVIMENTOSFORMAS_FINANCEIRA'));
                
                // valor Parcelas
                const vlpCredito          = cents(get('model.MOVIMENTOSFORMAS_VLRCREDITO'));
                const vlpChequePre        = cents(get('model.MOVIMENTOSFORMAS_VLRCHEQUEPRE'));

                const parCredito          = parseInt(get('model.MOVIMENTOSFORMAS_PRCCREDITO'));
                const parChequePre        = parseInt(get('model.MOVIMENTOSFORMAS_PRCCHEQUEPRE'));
                const creditoParcelado    = (vlpCredito    || 0) * (parCredito || 1);
                const preParcelado        = (vlpChequePre  || 0) * (parChequePre || 1);

                totalFormasPagamento += dinheiro   || 0;
                totalFormasPagamento += transferencia || 0;
                totalFormasPagamento += creditopessoa || 0;
                totalFormasPagamento += debito     || 0;
                totalFormasPagamento += cheque     || 0;
                totalFormasPagamento += (Math.abs(creditoParcelado - credito)       > 10 ? creditoParcelado : credito);
                totalFormasPagamento += (Math.abs(preParcelado - chequePre)         > 10 ? preParcelado : chequePre);
                totalFormasPagamento += carne;
                totalFormasPagamento += financeira;

                return totalFormasPagamento / 100;
            },
            
            valorRestanteFormatted: function(get) {
                return Ext.util.Format.maskRenderer('R$ #9.990,00', true)(get('valorRestante'));
            },
            
            novoValorFormatted: function(get) {
                return Ext.util.Format.maskRenderer('R$ #9.990,00', true)(get('novoValor'));
            },

            isFaturado: function(get) {
                return get('movimento.MOVIMENTOS_STATUS') == 'F';
            },
            
            readOnlyCartao: function(get) {
                return get('movimento.MOVIMENTOS_ID_APLICACOES') == 617; // Tudo que não for à vista
            }
            
        });
    }
});
