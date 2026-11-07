Ext.define('SamosAdmin.movimentos.cupomeletronico.form.caixa.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formcupomeletronicocaixa',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valorRecebido: 0
        });

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating') || get('isFaturado');
            },

            hideGravar: function (get) {
                return get('readOnly') || !get('movimento.MOVIMENTOS_NUMERO');
            },

            disableGravar: function(get) {
                return get('valorRestante') != 0;
            },
            
            troco: function(get) {
                const money = Ext.util.Format.maskRenderer('R$ #9.990,00', true);
                const valorDinheiro = cents(get('model.MOVIMENTOSCAIXA_DINHEIRO'));
                const valorRecebido = cents(get('model.DINHEIRO_RECEBIDO'));

                return money((valorRecebido - valorDinheiro) / 100);
            },

            valorRestante: function(get) {
                const totalMovimento = cents(get('movimento.MOVIMENTOS_TOTAL'));
                let totalCaixa = 0;

                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_DINHEIRO')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_CHEQUE')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_DEBITO')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_CREDITO')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_CREDITOLOJA')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_CREDITOPESSOA')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_ALIMENTACAO')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_REFEICAO')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_PRESENTE')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_COMBUSTIVEL')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_DUPLICATA')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_BOLETO')) || 0;
                totalCaixa += cents(get('model.MOVIMENTOSCAIXA_OUTRO')) || 0;
                totalCaixa -= cents(get('model.MOVIMENTOSCAIXA_TROCO')) || 0;

                return (totalMovimento - totalCaixa) / 100;
            },
            
            valorRestanteFormatted: function(get) {
                return Ext.util.Format.maskRenderer('R$ #9.990,00', true)(get('valorRestante'));
            },
            
            hideFinanceiro: function(get){
                const movimento  = get('movimento');
                const financeiro = movimento.get('MOVIMENTOS_FINANCEIROS') || [];
                const titulos = financeiro.filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                        titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
                    );
                });
                const hasFinanceiro = titulos && titulos[0];
                const duplicata = parseFloat(get('model.MOVIMENTOSCAIXA_DUPLICATA'));
                const boleto = parseFloat(get('model.MOVIMENTOSCAIXA_BOLETO'));  

                return !hasFinanceiro ||  !(duplicata || boleto);
            },
            
            hideFinanceira: function(get){
                const movimento  = get('movimento');
                const financeiro = movimento.get('MOVIMENTOS_FINANCEIROS') || [];
                const financeiras = financeiro.filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                        titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
                    );
                });
                const hasFinanceira = financeiras && financeiras[0];
                const valorFinanceira = parseFloat(get('model.MOVIMENTOSCAIXA_OUTRO'));

                return !hasFinanceira || !valorFinanceira;
            },

            chequesObrigatorio: function(get) {
                return get('movimento.DOCUMENTOS_COLETACHEQUE') == 'T';
            },

            hideCheques: function(get){
                var cheques = get('movimento.MOVIMENTOS_CHEQUES'),
                    hasCheques = cheques && cheques[0],
                    chequesObrigatorio = get('chequesObrigatorio');

                return !chequesObrigatorio || !hasCheques;
            },

            cartoesObrigatorio: function(get) {
                return get('movimento.DOCUMENTOS_COLETACARTAO') == 'T';
            },

            hideCartoes: function(get){
                var cartoes      = get('movimento.MOVIMENTOS_CARTOES'),
                    hasCartoes   = cartoes && cartoes[0],
                    cartoesObrigatorio = get('cartoesObrigatorio'),
                    credito      = get('model.MOVIMENTOSCAIXA_CREDITO'),
                    debito       = get('model.MOVIMENTOSCAIXA_DEBITO'),
                    loja         = get('model.MOVIMENTOSCAIXA_CREDITOLOJA'),
                    alimentacao  = get('model.MOVIMENTOSCAIXA_ALIMENTACAO'),
                    refeicao     = get('model.MOVIMENTOSCAIXA_REFEICAO'),
                    presente     = get('model.MOVIMENTOSCAIXA_PRESENTE'),
                    combustivel  = get('model.MOVIMENTOSCAIXA_COMBUSTIVEL');

                return !cartoesObrigatorio || 
                       !hasCartoes   || 
                       !(credito || debito || loja || alimentacao || refeicao || presente || combustivel);
            },

            hideBoleto: function(get) {
                return !get('readOnly') || 
                       !get('model.MOVIMENTOSCAIXA_DUPLICATA') || 
                       (configs.getPermissao()['EMPRESAS_ID_PORTADORES'] <= 1) || 
                       !get('isFaturado');
            },

            isFaturado: function(get) {
                return get('movimento.MOVIMENTOS_STATUS') == 'F';
            },
            
            isTransferenciaBancaria: function(get) {
                return get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS') != 0;
            }
        });
    }
});
