Ext.define('SamosAdmin.movimentos.movimento.form.caixa.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentoscaixa',

    constructor: function() {
        this.callParent(arguments);

        this.setData({
            valorRecebido: 0
        });

        this.setFormulas({
            hideAlterar: function(get) {
                return get('updating')   || 
                       get('isFaturado') ||
                       (
                           get('movimento.MOVIMENTOS_SERIEORIGEM') == 'ORC' &&
                           get('movimento.MOVIMENTOS_FORMASPAGAMENTO')      &&
                           get('movimento.MOVIMENTOS_FORMASPAGAMENTO')[0]
                       );
            },


            hideConfirmar: function(get) {
                return get('hideFechar') || !get('hideGravar');
            },

            hideGravar: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                
                return get('readOnly') ||
                       !get('movimento.MOVIMENTOS_NUMERO') ||
                       !formMovimento.getViewModel().get('readOnly');
            },

            hideSair: function (get) {
                const formMovimento = Ext.$('formmovimentos')[0];
                const movimento  = get('movimento');
                const formas = movimento.get('MOVIMENTOS_FORMASPAGAMENTO') || [];

                if(formas.length == 0) {
                    return false;
                } else {
                    return !get('readOnly') || !formMovimento.getViewModel().get('readOnly');
                }                
            },

            hideGravarConta: function (get) {

                return get('updating')   || 
                       get('isFaturado') ||
                       (get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS') == 0)
            },

            limiteBoletoExcedido: function (get) {

                const formMovimento = Ext.$('formmovimentos')[0];

                const totalAberto = cents(get('movimento.ABERTO_FINANCEIROPESSOA'));
                const totalMovimento = cents(get('model.MOVIMENTOSCAIXA_DUPLICATA'));

                if(!formMovimento.getViewModel().get('isPedidoHospitalar')) {
                    return false;
                }

                if(get('movimento.PESSOAS_ID_USUARIOS') == 999) {
                    return false;
                }

                if(totalMovimento == 0) {
                    return false;
                }
                
                return ((totalMovimento + totalAberto) > cents(configs.getFinanceiros().limiteCredito))
            },

            disableConfirmar: function(get) {
                return get('valorRestante') != 0;
            },

            disableGravar: function(get) {
                return get('valorRestante') != 0 || get('limiteBoletoExcedido');
            },
            
            troco: function(get) {
                const money = Ext.util.Format.maskRenderer('R$ #9.990,00', true);
                const valorDinheiro = cents(get('model.MOVIMENTOSCAIXA_DINHEIRO'));
                const valorRecebido = cents(get('model.DINHEIRO_RECEBIDO'));

                return money((valorRecebido - valorDinheiro) / 100);
            },

            valorRestante: function(get) {
                const totalMovimento = cents(get('movimento.MOVIMENTOS_TOTAL')) - cents(get('movimento.MOVIMENTOS_VALORRETENCAO'));
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


            hideDuplicata: function(get) {
                const movimento = get('movimento');
                return !(movimento.get('PORTADORES_ID') === 5 && configs.getClientName() === 'cirurcenter') ;
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

            readOnlyCartao: function(get) {
                return configs.getClientName() == 'prudenmoveis' && 
                       get('movimento.MOVIMENTOS_ID_APLICACOES') == 617; // Pagtos considerados à vista
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
                       (configs.getEmpresa().portador <= 1) ||
                       !get('isFaturado');
            },

            hideEmail: function(get) {
                return !get('readOnly') || 
                       !get('model.MOVIMENTOSCAIXA_DUPLICATA') || 
                       (configs.getEmpresa().portador <= 1) || 
                       !get('isFaturado');
            },

            isFaturado: function(get) {
                
                return (get('movimento.MOVIMENTOS_STATUS') == 'F' ||
                        get('movimento.MOVIMENTOS_PROTOCOLO') != '')

            },

            isNotaFaturada: function(get) {
                const formMovimento = Ext.$('formmovimentos')[0];                
                const protocolo = get('movimento.MOVIMENTOS_PROTOCOLO');
                const notaEletronica = formMovimento.getViewModel().get('listName').match(/Eletr/);
                return (notaEletronica && protocolo);
            },


            isDevolucao: function(get) {
                const formMovimento = Ext.$('formmovimentos')[0];                
                const result = formMovimento.getViewModel().get('listName').match(/Devolu/);
                return result;
            },

            isEntregue: function(get) {
                return get('movimento.MOVIMENTOS_SITUACAO') == 0;
            },

            isTransferenciaBancaria: function(get) {
                if(configs.getFinanceiros().contaCorrentes) {
                    return get('model.MOVIMENTOSCAIXA_TRANSFERENCIAS') != 0;
                }

                return false
            }
        });
    }
});
