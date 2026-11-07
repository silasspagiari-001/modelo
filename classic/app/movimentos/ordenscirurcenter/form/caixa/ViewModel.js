Ext.define('SamosAdmin.movimentos.ordenscirurcenter.form.caixa.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formordenscirurcentercaixa',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valorRecebido: 0
        });

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating')   || 
                       get('isFaturado') || get('movimento.ORDENS_STATUS') == 'E' ||
                       (
                           get('movimento.ORDENS_SERIEORIGEM') == 'ORC' &&
                           get('movimento.ORDENS_FORMASPAGAMENTO')      &&
                           get('movimento.ORDENS_FORMASPAGAMENTO')[0]
                       );
            },

            hideConfirmar: function(get) {
                return get('hideFechar') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formordenscirurcenter')[0];
                
                return get('readOnly') ||
                       !get('movimento.ORDENS_NUMERO') ||
                       !formMovimento.getViewModel().get('readOnly');
            },

            hideSair: function (get) {
                const formMovimento = Ext.$('formordenscirurcenter')[0];
                
                return !get('readOnly') || 
                       !formMovimento.getViewModel().get('readOnly');
            },

            hideGravarConta: function (get) {

                return get('updating')   || 
                       get('isFaturado') ||
                       (get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS') == 0)
            },

            disableConfirmar: function(get) {
                return get('valorRestante') != 0;
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
                const totalMovimento = cents(get('movimento.ORDENS_TOTAL'));
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

            hideCancelar: function(get) {
                return true;
            },

            hideFinanceiro: function(get){
                const movimento  = get('movimento');
                const financeiro = movimento.get('ORDENS_FINANCEIROS') || [];
                const titulos = financeiro.filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                        titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
                    );
                });
                const hasFinanceiro = titulos && titulos[0];
                const duplicata = parseFloat(get('model.MOVIMENTOSCAIXA_DUPLICATA'));
                const boleto = parseFloat(get('model.MOVIMENTOSCAIXA_BOLETO'));

                let outros = 0;

                if(configs.getFinanceiros().duplicata) {
                    if(configs.getFinanceiros().duplicata.dinheiro) {
                        outros += cents(get('model.MOVIMENTOSCAIXA_DINHEIRO'));
                    }
            
                    if(configs.getFinanceiros().duplicata.cheque) {
                        outros += cents(get('model.MOVIMENTOSCAIXA_CHEQUE'));
                    }        
            
                    if(configs.getFinanceiros().duplicata.debito) {
                        outros += cents(get('model.MOVIMENTOSCAIXA_DEBITO'));
                    }        
            
                    if(configs.getFinanceiros().duplicata.credito) {
                        outros += cents(get('model.MOVIMENTOSCAIXA_CREDITO'));
                    }        
            
                    if(configs.getFinanceiros().duplicata.pix) {
                        outros += cents(get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS'));
                    }     
                }
                        
                return !hasFinanceiro ||  !(duplicata || boleto || outros);
            },
            
            hideFinanceira: function(get){
                const movimento  = get('movimento');
                const financeiro = movimento.get('ORDENS_FINANCEIROS') || [];
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
                var cheques = get('movimento.ORDENS_CHEQUES'),
                    hasCheques = cheques && cheques[0],
                    chequesObrigatorio = get('chequesObrigatorio');

                return !chequesObrigatorio || !hasCheques;
            },

            cartoesObrigatorio: function(get) {
                return get('movimento.DOCUMENTOS_COLETACARTAO') == 'T';
            },

            hideCartoes: function(get){
                var cartoes      = get('movimento.ORDENS_CARTOES'),
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

            readOnlyDinheiro: function(get) {
                return configs.getFinanceiros().duplicata ? configs.getFinanceiros().duplicata.readOnlyDinheiro : false;
            },

            readOnlyCheque: function(get) {
                return configs.getFinanceiros().duplicata ? configs.getFinanceiros().duplicata.readOnlyCheque : false;
            },

            readOnlyDebito: function(get) {
                return configs.getFinanceiros().duplicata ? configs.getFinanceiros().duplicata.readOnlyDebito : false;
            },

            readOnlyCredito: function(get) {
                return configs.getFinanceiros().duplicata ? configs.getFinanceiros().duplicata.readOnlyCredito : false;
            },

            readOnlyPix: function(get) {
                return configs.getFinanceiros().duplicata ? configs.getFinanceiros().duplicata.readOnlyPix : false;
            },

            readOnlyOutro: function(get) {
                return configs.getFinanceiros().duplicata ? configs.getFinanceiros().duplicata.readOnlyOutro : false;
            },

            readOnlyDuplicata: function(get) {
                const movimento  = get('movimento');
                const bloqueado = movimento.get('PESSOAS_TIPO') == 'X' && configs.getClientName() == 'hospitalar';

                return bloqueado;
            },

            hideBoleto: function(get) {
                return !get('readOnly') || 
                       !get('model.MOVIMENTOSCAIXA_DUPLICATA') || 
                       (configs.getPermissao()['EMPRESAS_ID_PORTADORES'] <= 1) || 
                       !get('isFaturado');
            },

            hideEmail: function(get) {
                return !get('readOnly') || 
                       !get('model.MOVIMENTOSCAIXA_DUPLICATA') || 
                       (configs.getPermissao()['EMPRESAS_ID_PORTADORES'] <= 1) || 
                       !get('isFaturado');
            },

            isFaturado: function(get) {
                
                return (get('movimento.ORDENS_STATUS') == 'F' ||
                        get('movimento.ORDENS_PROTOCOLO') != '')

            },

            isNotaFaturada: function(get) {
                const formMovimento = Ext.$('formordenscirurcenter')[0];                
                const protocolo = get('movimento.ORDENS_PROTOCOLO');
                const notaEletronica = formMovimento.getViewModel().get('listName').match(/Eletr/);
                return (notaEletronica && protocolo);
            },


            isDevolucao: function(get) {
                const formMovimento = Ext.$('formordenscirurcenter')[0];                
                const result = formMovimento.getViewModel().get('listName').match(/Devolu/);
                return result;
            },

            isEntregue: function(get) {
                return get('movimento.ORDENS_STATUS') == 'E';
            },

            isTransferenciaBancaria: function(get) {
                return get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS') != 0;
            }
        });
    }
});
