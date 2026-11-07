Ext.define('SamosAdmin.movimentos.movimento.form.caixa.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentoscaixa',

    mixins: {
        cartoes: 'SamosAdmin.movimentos.movimento.form.caixa.cartoes.Mixin'
    },

    initViewModel: function(vm) {  
        this.callParent(arguments);
        setTimeout(() => {
            const movimento = this.getView().up('formmovimentos').getViewModel().get('model');
            const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'));
            const isVendaConsumidor = movimento.get('MOVIMENTOS_ID_PESSOAS') == movimento.get('DOCUMENTOS_ID_PESSOAS');
            const carregarTipo = configs.getMovimentos().autoEnvioSefaz;
            const tipoPagto    = movimento.get('MOVIMENTOS_SITUACAO') || '';

            const pagIdPessoas       = movimento.get('MOVIMENTOS_ID_PESSOAS');
            const pagCreditoPessoa   = cents(movimento.get('PESSOAS_CREDITO') || 0)
            const pagIdAplicacoes    = movimento.get('OPERACOES_ID_APLICACOES');
            const pagTipo            = movimento.get('OPERACOES_TIPO') == 'E' ? 'S' : 'E';
            const serie              = movimento.get('MOVIMENTOS_SERIE')  || '[NUMERO]';
            const numero             = movimento.get('MOVIMENTOS_NUMERO') || '[SERIE]';
            const creditoDigitado    = vm.get('model.MOVIMENTOSCAIXA_CREDITOPESSOA');

            const pagNome = serie + ' ' + numero + ' ' + movimento.get('MOVIMENTOS_NOME').toString().replace(/'/ig, '');

            if(carregarTipo) { // Raçaforte
                if(tipoPagto == 'A') {  // Boleto
                    vm.set('model.MOVIMENTOSCAIXA_DUPLICATA', (totalMovimento / 100));
                }
                if(tipoPagto == 'B') {  // Dinheiro
                    vm.set('model.MOVIMENTOSCAIXA_DINHEIRO', (totalMovimento / 100));
                }
                if(tipoPagto == 'C') {  // Cartão Débito
                    vm.set('model.MOVIMENTOSCAIXA_DEBITO', (totalMovimento / 100));
                }
                if(tipoPagto == 'D') {  // Cartão Crédito
                    vm.set('model.MOVIMENTOSCAIXA_CREDITO', (totalMovimento / 100));
                }
                if(tipoPagto == 'E') {  // Pix
                    vm.set('model.MOVIMENTOSCAIXA_TRANSFERENCIAS', (totalMovimento / 100));
                }
                if(tipoPagto == 'F') {  // Cheque
                    vm.set('model.MOVIMENTOSCAIXA_CHEQUE', (totalMovimento / 100));
                }
            }

            if(configs.getClientName() == 'acomtf') {
                if(movimento.get('MOVIMENTOS_ID_PRAZOS') == 1) {
                    movimento.set('PORTADORES_ID', 1); // Carteira
                    vm.set('model.MOVIMENTOSCAIXA_DINHEIRO', (totalMovimento / 100));
                } else {
                    vm.set('model.MOVIMENTOSCAIXA_DUPLICATA', (totalMovimento / 100));
                }
            }

            if(configs.getFinanceiros().contaCorrentes) { 
                // Se usa contacorrentes, é obrigatório informar a pessoa tipo conta bancária
            } else {    
                vm.set('model.MOVIMENTOSCAIXA_ID_PESSOAS', pagIdPessoas);
                vm.set('model.CONTAS_TIPO', 'C');
            }

            if(!creditoDigitado) {
                vm.set('model.MOVIMENTOSCAIXA_CREDITOPESSOA', (pagCreditoPessoa > totalMovimento && !isVendaConsumidor ? totalMovimento : pagCreditoPessoa) / 100);
            }
            vm.set('model.MOVIMENTOSCAIXA_ID_APLICACOES', pagIdAplicacoes);
            vm.set('model.MOVIMENTOSCAIXA_EXPORTADO',     'N');
            vm.set('model.MOVIMENTOSCAIXA_NOME',          pagNome);
            vm.set('model.MOVIMENTOSCAIXA_TIPO',          pagTipo);
            this.lookup('duplicata').focus(true);
        }, 500);
    },

    onConfirmarClick: function (btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const caixa = this.getViewModel().get('model');

        if(!caixa.get('PORTADORES_NOME') && caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS') > 0) {
            return Ext.Note('warning', 'Informe a conta bancária');
        }

        this.validarCabecalho()
            .then(() => this.validarFinanceiro())
            .then(valido => valido ? this.validarFinanceira() : false)
            .then(valido => valido ? this.mixins.cartoes.validarCartoes() : false)
            .then(valido => valido ? this.validarCheques() : false)
            .then(valido => {
                if(valido) {
                    Movimento.services.Caixa.calcularPartida();
                    Ext.defer(ctrlMovimento.onFecharClick, 200, ctrlMovimento);
                    Ext.defer(this.onSairClick, 500, this, ['preserveMask']);
                }
            });
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = formMovimento.getViewModel().get('model');
        const caixa = this.getViewModel().get('model');
        
        this.validarCabecalho()
            .then(() => this.validarFinanceiro())
            .then(valido => valido ? this.validarFinanceira() : false)
            .then(valido => valido ? this.validarTransferencia() : false)
            .then(valido => valido ? this.mixins.cartoes.validarCartoes() : false)
            .then(valido => valido ? this.validarCheques() : false)            
            .then(valido => valido ? Movimento.services.Caixa.validarReceber() : false)
            .then(valido => {
                if(valido) {
                    Movimento.services.Caixa.calcularPartida();

                    Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                        if (btn == 'yes') {
                            this.getView().initGauge('Gravando...');

                            if(!formMovimento.getViewModel().get('isNotaEletronica') &&
                               !formMovimento.getViewModel().get('isPedidoHospitalar')) {
                                const operacaoAtual = movimento.get('MOVIMENTOS_ID_OPERACOES');
                                const novaOperacao  = operacaoAtual == 501000 ? 500000 : operacaoAtual;
    
                                movimento.set({
                                    'MOVIMENTOS_ENTRADASAIDA': momentServer().format('YYYY-MM-DD'),
                                    'MOVIMENTOS_LOG'         : SamosUtils.Info.getLog(),
                                    'MOVIMENTOS_STATUS'      : 'F',
                                    'MOVIMENTOS_ID_OPERACOES': novaOperacao
                                });
                            }
                            
                            ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
                            movimento.save()
                                .then(movimento => {
                                    if (caixa.get('MOVIMENTOSCAIXA_CREDITOPESSOA') > 0) {
                                        Caixa.services.CreditoPessoa.gravar({
                                            pessoa:   movimento.get('MOVIMENTOS_ID_PESSOAS'),
                                            valor:    caixa.get('MOVIMENTOSCAIXA_CREDITOPESSOA'),
                                            tipo:     caixa.get('MOVIMENTOSCAIXA_TIPO'),
                                            emissao:  caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                            empresa:  movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                                            numero:   movimento.get('MOVIMENTOS_NUMERO'),
                                            serie:    movimento.get('MOVIMENTOS_SERIE'),
                                            log:      SamosUtils.Info.getLog()
                                        });
                                    }
                                    return movimento;
                                })
                                .then(async movimento => {
                                    if (caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS') > 0) {
                                        await SamosUtils.Request.nodeApi({
                                            url: `/depositocorrente`, // antes: deposito
                                            method: 'POST',
                                            data: {
                                                'CONTACORRENTES_ID_EMPRESAS':    configs.getEmpresa().id,
                                                'CONTACORRENTES_ID_PESSOAS':     caixa.get('MOVIMENTOSCAIXA_ID_PESSOAS'),
                                                'CONTACORRENTES_ID_APLICACOES':  caixa.get('MOVIMENTOSCAIXA_ID_APLICACOES'),   
                                                'CONTACORRENTES_ID_FINANCEIROS': 0,
                                                'CONTACORRENTES_STATUS':         'T',
                                                'CONTACORRENTES_CONCILIADO':     'T',
                                                'CONTACORRENTES_EMISSAO':        caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                                'CONTACORRENTES_VENCIMENTO':     caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                                'CONTACORRENTES_PAGAMENTO':      caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                                'CONTACORRENTES_COMPENSADO':     caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                                'CONTACORRENTES_NOME':           caixa.get('MOVIMENTOSCAIXA_NOME'),
                                                'CONTACORRENTES_DOCUMENTO':      caixa.get('CONTACORRENTES_DOCUMENTO'),
                                                'CONTACORRENTES_OBSERVACOES':    '',
                                                'CONTACORRENTES_DEBITOCREDITO':  (caixa.get('MOVIMENTOSCAIXA_TIPO') == 'E' ? 'C' : 'D'),
                                                'CONTACORRENTES_FINANCEIRO':     'N',
                                                'CONTACORRENTES_VALOR':          caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'),           
                                                'CONTACORRENTES_LOG':            SamosUtils.Info.getLog()
                                            }
                                        });
                                    }
                                    return movimento;
                                })
                                .then(movimento => {
                                    if(
                                        configs.getMovimentos().autoGerarRomaneio && 
                                        configs.getMovimentos().ramoRomaneio == 'construcao'
                                    ) { 
                                        if(!this.getViewModel().get('isEntregue')) {
                                            Movimento.services.EntregaConstrucao.gerarRomaneio(
                                                {
                                                    movimento: movimento.get('MOVIMENTOS_ID'),
                                                    empresa: configs.getEmpresa().id,
                                                    documento: movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
                                                    numero: movimento.get('MOVIMENTOS_NUMERO'),    
                                                    serie: movimento.get('MOVIMENTOS_SERIE'),
                                                    emissao: movimento.get('MOVIMENTOS_EMISSAO'),
                                                    hora: movimento.get('MOVIMENTOS_HORA'),
                                                    usuario: configs.getUsuario().id,
                                                    log: SamosUtils.Info.getLog(),
                                                    observacoes: movimento.get('MOVIMENTOS_OBSERVACOES'),
                                                    pessoa: movimento.get('MOVIMENTOS_ID_PESSOAS'),
                                                    itens: movimento.get('MOVIMENTOS_ITENS')
                                                }
                                            )                                                                
                                        }    
                                    }
                                    return movimento;
                                })
                                .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                                .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                                .finally(() => {
                                    ctrlMovimento.getListView().down('grid').getStore().load();

                                    ctrlMovimento.aposGravar.call(ctrlMovimento);
                                    ctrlMovimento.setReadOnly.call(this, true);
                                    this.onSairClick();

                                    if(configs.getMovimentos().autoEnvioSefaz &&
                                       configs.getUsuario().tipo != '0' &&
                                       formMovimento.getViewModel().get('isNotaEletronica') &&
                                       !formMovimento.getViewModel().get('hasProtocolo')) {
                                        ctrlMovimento.onSefazClick.call(ctrlMovimento);
                                    }

                                    if( formMovimento ){
                                        if( formMovimento.onAposPagamento ){
                                            formMovimento.onAposPagamento.bind(formMovimento.getController())(formMovimento);
                                        }
                                    }
                                });
                        }
                    });
                }
            });
    },

    onGravarContaClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = formMovimento.getViewModel().get('model');
        const caixa = this.getViewModel().get('model');
        const idPortador = caixa.get('MOVIMENTOSCAIXA_ID_PORTADORES');
        const idDocumento = caixa.get('CONTACORRENTES_DOCUMENTO');
        
        this.validarCabecalho()
            .then(() => this.validarFinanceiro())
            .then(valido => valido ? this.validarFinanceira() : false)
            .then(valido => valido ? this.validarTransferencia() : false)
            .then(valido => valido ? this.mixins.cartoes.validarCartoes() : false)
            .then(valido => valido ? this.validarCheques() : false)            
            .then(valido => valido ? Movimento.services.Caixa.validarReceber() : false)
            .then(valido => {
                if(valido) {
                    Movimento.services.Caixa.calcularPartida();

                    Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                        if (btn == 'yes') {
                            this.getView().initGauge('Gravando...');

                            if(!formMovimento.getViewModel().get('isNotaEletronica')) {
                                const operacaoAtual = movimento.get('MOVIMENTOS_ID_OPERACOES');
                                const novaOperacao  = operacaoAtual == 501000 ? 500000 : operacaoAtual;
    
                                movimento.set({
                                    'MOVIMENTOS_ENTRADASAIDA': momentServer().format('YYYY-MM-DD'),
                                    'MOVIMENTOS_LOG'         : SamosUtils.Info.getLog(),
                                    'MOVIMENTOS_STATUS'      : 'F',
                                    'MOVIMENTOS_ID_OPERACOES': novaOperacao
                                });
                            }
                            
                            ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
                            movimento.save()
                                .then(async movimento => {
                                    await SamosUtils.Request.nodeApi({
                                        url: `/deposito/lote`,
                                        method: 'PUT',
                                        data: {
                                            idmovimento: movimento.get('MOVIMENTOS_ID'),
                                            idportador : idPortador,
                                            iddocumento: idDocumento,
                                            log        : SamosUtils.Info.getLog()
                                        }
                                    });

                                    return movimento;
                                })
                                .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                                .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                                .finally(() => {
                                    ctrlMovimento.getListView().down('grid').getStore().load();
                                    ctrlMovimento.aposGravar.call(ctrlMovimento);
                                    ctrlMovimento.setReadOnly.call(this, true);
                                    this.onSairClick();
                                });
                        }
                    });
                }
            });
    },

    onCancelarClick: function(btn, event) {
        this.getViewModel().set('model', undefined);
        //this.cancelar();
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },
    
    onCartoesClick: function (btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
            
        ctrlMovimento.mixins.cartoes.exibirJanelaCartoes();
    },
    
    onFinanceiroClick: function (btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const vmMovimento   = formMovimento.getViewModel();
        const movimento     = vmMovimento.get('model');
        const listFinanceiro = Ext.create({
            xtype: 'formmovimentoscaixafinanceiro'
        });
        const dataFinanceiro = vmMovimento.get('model.MOVIMENTOS_FINANCEIROS') || [];
        const titulos = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
            );
        });
        const dataModel = titulos ? vmMovimento.get('model').data : {};
        const caixa = this.getViewModel().get('model');
        let valorFinanceiro = cents(caixa.get('MOVIMENTOSCAIXA_DUPLICATA')) + cents(caixa.get('MOVIMENTOSCAIXA_BOLETO'))

        // Nova regra, baseada no config
        if(configs.getFinanceiros().duplicata) {  // Se tiver no config gerar financeiro de din, che, etc.
            if(configs.getFinanceiros().duplicata.dinheiro) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_DINHEIRO'));
            }
    
            if(configs.getFinanceiros().duplicata.cheque) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE'));
            }        
    
            if(configs.getFinanceiros().duplicata.debito) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_DEBITO'));
            }        
    
            if(configs.getFinanceiros().duplicata.credito) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_CREDITO'));
            }        
    
            if(configs.getFinanceiros().duplicata.pix) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'));
            }     
        }
        
        const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'));
        const totalDinheiro  = cents(caixa.get('MOVIMENTOSCAIXA_DINHEIRO'));
        const totalDebito    = cents(caixa.get('MOVIMENTOSCAIXA_DEBITO'));
        const totalPix       = cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'));

        const apenasDinheiro = (totalDinheiro == totalMovimento);
        const apenasDebito   = (totalDebito   == totalMovimento);
        const apenasPix      = (totalPix      == totalMovimento);

        if(apenasDinheiro || apenasDebito || apenasPix) {
            movimento.set({
                'MOVIMENTOS_ID_PRAZOS': 1,
                'PRAZOS_NOME': 'VENDA A VISTA',
                'PRAZOS_PARCELAS': 1,
                'PRAZOS_PARCELAMENTO': 0
            })
        }
            
        listFinanceiro.getViewModel().set({
            valorFinanceiro: valorFinanceiro / 100,
            movimento: vmMovimento.get('model'),
            model: Ext.create('SamosAdmin.movimentos.movimento.Model', dataModel),
            localData: vmMovimento.get('financeiroLocalData'),
            dataFinanceiro: titulos,
            readOnly: this.getViewModel().get('readOnly')
        });

        listFinanceiro.lookup('prazo').setSearchedId(dataModel['MOVIMENTOS_ID_PRAZOS']);
        listFinanceiro.focus();
        formMovimento.add(listFinanceiro);
    },
    
    onFinanceiraClick: function (btn, e) {
        const formMovimento = Ext.$('formmovimentos')[0];
        const vmMovimento = formMovimento.getViewModel();
        const caixa = this.getViewModel().get('model');
        const valorFinanceira = cents(caixa.get('MOVIMENTOSCAIXA_OUTRO'));
        const movimento = vmMovimento.get('model');
        const formaPagamento = movimento.get('MOVIMENTOS_FORMASPAGAMENTO');
        const isFaturado = vmMovimento.get('isFaturado');
        const dataFinanceiro = vmMovimento.get('model.MOVIMENTOS_FINANCEIROS') || [];
        const financeiras = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
            );
        });
        const partidaFinanceira = movimento.get('MOVIMENTOS_BASEST'); // Partida financeira informada sempre
        const financeiraExistente = financeiras && financeiras[0] ? financeiras[0] : {
            'FINANCEIROS_NUMERO':        movimento.get('MOVIMENTOS_NUMERO'), 
            'FINANCEIROS_SERIE':         movimento.get('MOVIMENTOS_SERIE'), 
            'FINANCEIROS_TIPO':          movimento.get('OPERACOES_FINANCEIRO'), 
            'FINANCEIROS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'), 
            'FINANCEIROS_ID_DOCUMENTOS': movimento.get('MOVIMENTOS_ID_DOCUMENTOS'), 
            'FINANCEIROS_ID_PESSOAS':    '',
            'PESSOAS_TIPO':              configs.getFinanceiros().tipoFinanceira,
            'FINANCEIROS_ID_USUARIOS':   movimento.get('MOVIMENTOS_ID_USUARIOS'), 
            'FINANCEIROS_ID_PORTADORES': configs.getEmpresa().portador,
            'FINANCEIROS_ID_APLICACOES': movimento.get('OPERACOES_ID_APLICACOES') || 1,
            'FINANCEIROS_ID_PRAZOS':     movimento.get('MOVIMENTOS_ID_PRAZOS'),
            'FINANCEIROS_PARCELA':       '',
            'FINANCEIROS_VENCIMENTO':    momentServer().format('YYYY-MM-DD'),
            'FINANCEIROS_BAIXA':         '1899-12-30',
            'FINANCEIROS_PAGAMENTO':     '1899-12-30',
            'FINANCEIROS_PAGO':          0,
            'FINANCEIROS_STATUS':        'A',
            'FINANCEIROS_PARCELAS':      ''
        };

        financeiraExistente['FINANCEIROS_TOTAL'] = (valorFinanceira / 100);
        financeiraExistente['FINANCEIROS_ABERTO'] = financeiraExistente['FINANCEIROS_TOTAL'];
        
        if(!btn){
            financeiraExistente['FINANCEIROS_ORIGINAL'] = partidaFinanceira;
            financeiraExistente['FINANCEIROS_PARCELAS'] = '';
        }

        if(!financeiraExistente['FINANCEIROS_ID']) {
            financeiraExistente['FINANCEIROS_ID'] = -999999;//pra nao coincidir com o financeiro
        }

        const financeira = Ext.create(
            'SamosFinanceiros.titulos.Model', 
            Ext.Object.merge({}, financeiraExistente)
        );
        
        const viewFinanceira = Ext.create({
            xtype: 'formmovimentoscaixafinanceira'
        });
        
        viewFinanceira.getViewModel().set({
            movimento: movimento,
            model: financeira,
            formaPagamento: formaPagamento && formaPagamento[0] && isFaturado, //formaPagamento[0]['MOVIMENTOSFORMAS_ID'] > 0,
            readOnly: this.getViewModel().get('readOnly')
        });

        viewFinanceira.focus(true);
        formMovimento.add(viewFinanceira);
    },

    validarTransferencia: function () {
        const caixa = this.getViewModel().get('model');

        if(cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS')) == 0) {
            const formMovimento = this.getView().up('formmovimentos');
            const vmMovimento   = formMovimento.getViewModel();
            const movimento     = vmMovimento.get('model');                
            caixa.set('MOVIMENTOSCAIXA_ID_PESSOAS', movimento.get('MOVIMENTOS_ID_PESSOAS'));
            return true;
        }

        if(caixa.get('CONTAS_TIPO') != 'C') {
            Ext.Note('warning', 'Informe a conta para a Transferência');
            return false;   
        }

        if(cents(caixa.get('MOVIMENTOSCAIXA_ID_PESSOAS')) == 0) {
            Ext.Note('warning', 'Informe a conta para a Transferência');
            return false;   
        }

        return true;
    },

    validarFinanceiro: function() {
        const viewFinanceiro  = Ext.$('formmovimentoscaixafinanceiro')[0];
        const caixa           = this.getViewModel().get('model');
        const formMovimento   = this.getView().up('formmovimentos');
        const movimento       = formMovimento.getViewModel().get('model');
        const dataFinanceiro  = movimento.get('MOVIMENTOS_FINANCEIROS') || [];

        let valorFinanceiro = cents(caixa.get('MOVIMENTOSCAIXA_DUPLICATA')) + cents(caixa.get('MOVIMENTOSCAIXA_BOLETO'));

        if(configs.getFinanceiros().duplicata) {
            if(configs.getFinanceiros().duplicata.dinheiro) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_DINHEIRO'));
            }
    
            if(configs.getFinanceiros().duplicata.cheque) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE'));
            }        
    
            if(configs.getFinanceiros().duplicata.debito) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_DEBITO'));
            }        
    
            if(configs.getFinanceiros().duplicata.credito) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_CREDITO'));
            }        
    
            if(configs.getFinanceiros().duplicata.pix) {
                valorFinanceiro += cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'));
            }    
        }

        let valid = false;

        const titulos = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
            );
        });

        const financeiras = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
            );
        });

        if(valorFinanceiro == 0) {
            movimento.set('MOVIMENTOS_FINANCEIROS', financeiras);
            return true;
        } else {
            const totalFinanceiro = titulos.reduce((total, titulo) => {
                return total += cents(titulo['FINANCEIROS_ORIGINAL']);
            }, 0);

            if(totalFinanceiro != valorFinanceiro) {
                if(viewFinanceiro && viewFinanceiro.isVisible(true)){
                    const diff = Ext.util.Format.maskRenderer('#9.990,00', true)((totalFinanceiro - valorFinanceiro) / 100);
                    Ext.Note('warning', (diff > 0 ? 'Faltam ' : 'Sobram ') + diff);
                }
                valid = false;
            } else {
                valid = true;
            }
        }

        if(valid) {
            if(viewFinanceiro && viewFinanceiro.isVisible(true)) {
                let ctrlFinanceiro = viewFinanceiro.getController(); 
                Ext.defer(ctrlFinanceiro.onSairClick, 400, ctrlFinanceiro);    
            }
        } else {
            if(viewFinanceiro && viewFinanceiro.isVisible(true)) {
                viewFinanceiro.focus();
            } else {
                this.onFinanceiroClick(arguments);
            }
        }

        return valid;
    },

    validarFinanceira: function() {

        if(configs.getMovimentos().ramoRomaneio != 'moveis') {
            return true;
        };

        const viewFinanceira = Ext.$('formmovimentoscaixafinanceira')[0];
        const caixa = this.getViewModel().get('model');
        const formMovimento = this.getView().up('formmovimentos');
        const movimento = formMovimento.getViewModel().get('model');
        const dataFinanceiro = movimento.get('MOVIMENTOS_FINANCEIROS') || [];
        const valorFinanceira = cents(caixa.get('MOVIMENTOSCAIXA_OUTRO'));
        const titulos = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
            );
        });
        const financeiras = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
            );
        });

        let valid = false;

        if(valorFinanceira == 0) {
            movimento.set('MOVIMENTOS_FINANCEIROS', titulos);
            return true;

        } else {
            const totalFinanceira = financeiras.reduce((total, financeira) => {
                return total += cents(financeira['FINANCEIROS_TOTAL']);
            }, 0);

            if(totalFinanceira != valorFinanceira) {
                if(viewFinanceira && viewFinanceira.isVisible(true)){
                    const diff = Ext.util.Format.maskRenderer('#9.990,00', true)((totalFinanceira - valorFinanceira) / 100);
                    Ext.Note('warning', (diff > 0 ? 'Faltam ' : 'Sobram ') + diff);
                }
                valid = false;
            } else {
                valid = true;
            }
        }

        if(valid) {
            if(viewFinanceira && viewFinanceira.isVisible(true)) {
                let ctrlFinanceira = viewFinanceira.getController(); 
                Ext.defer(ctrlFinanceira.onSairClick, 400, ctrlFinanceira);    
            }
        } else {
            if(viewFinanceira && viewFinanceira.isVisible(true)) {
                viewFinanceira.focus();
            } else {
                this.onFinanceiraClick();
            }
        }

        return valid;
    },
    
    onBoletoClick: async function(btn, e) {
        const view = this.getView();

        try {
            const movimento = this.getViewModel().get('movimento');
    
            if(await SamosUtils.Msg.confirm('Deseja realmente emitir o boleto?')) {
                view.initGauge('Gerando arquivo para impressão...');
    
                const dataFinanceiro = (movimento.get('MOVIMENTOS_FINANCEIROS') || []);
                const idPortador = cents(movimento.get('PORTADORES_ID')) / 100;
                const titulos = dataFinanceiro.filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                        titulo['FINANCEIROS_ID_PESSOAS'] != '999999' &&
                        titulo['FINANCEIROS_VENCIMENTO'] != titulo['FINANCEIROS_EMISSAO'] &&
                        titulo['FINANCEIROS_STATUS'] != 'P'
                    );
                });
                
                const ids = titulos.map(titulo => titulo['FINANCEIROS_ID']).join(',');

                const portadorBol = (configs.getFinanceiros().portadores || []).length > 0 ?
                                    (idPortador || configs.getEmpresa().portador) :
                                    configs.getEmpresa().portador;
    
                const idsSemNossoNumero = titulos.filter(titulo => !titulo['FINANCEIROS_NOSSONUMERO']).map(titulo => titulo['FINANCEIROS_ID']).join(',');

                if(idsSemNossoNumero.length > 0) {
                    await this.gerarNossoNumero(idsSemNossoNumero, portadorBol);
                }

                const layout = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';
  
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/${layout}`,
                    method: 'GET',
                    data: {
                        ids: ids,
                        empresa: configs.getEmpresa().id,
                        portador: titulos[0]['FINANCEIROS_ID_PORTADORES']
                    }
                });

                this.onSairClick();  // Fecha a janela do caixa

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
                
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir boleto');
        }

        view.stopGauge();
    },


    onDuplicataClick: async function(btn, e) {
        const view = this.getView();
        const movimento = this.getViewModel().get('movimento');

        console.log('Portador',movimento.get('PORTADORES_ID'));
        try {
    
            if(await SamosUtils.Msg.confirm('Deseja realmente emitir a Duplicata?')) {
                view.initGauge('Gerando arquivo para impressão...');
    
                const dataFinanceiro = (movimento.get('MOVIMENTOS_FINANCEIROS') || []);
                const idPortador = cents(movimento.get('PORTADORES_ID')) / 100;
                const titulos = dataFinanceiro.filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                        titulo['FINANCEIROS_ID_PESSOAS'] != '999999' &&
                        titulo['FINANCEIROS_VENCIMENTO'] != titulo['FINANCEIROS_EMISSAO'] &&
                        titulo['FINANCEIROS_STATUS'] != 'P'
                    );
                });
                
                const ids = titulos.map(titulo => titulo['FINANCEIROS_ID']).join(',');
    
                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/duplicatas`,
                    method: 'GET',
                    data: {
                        ids: ids,
                        empresa: configs.getEmpresa().id,
                        portador: titulos[0]['FINANCEIROS_ID_PORTADORES']
                    }
                });

                this.onSairClick();  // Fecha a janela do caixa

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
                
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir boleto');
        }

        view.stopGauge();
    },

    gerarNossoNumero: async function(ids, portador) {
        let progress;

        try {
            const empresa  = configs.getEmpresa().id;

            const tempoPorBoleto = 250;//ms
            const tempoEstimado  = (tempoPorBoleto * (ids.length || 1)) + 500;
            
            progress = Ext.Progress(tempoEstimado, 'Gerando Nosso Número');

            const guidBoleto = SamosUtils.String.gerarGuid();
            await SamosUtils.Request.nodeApi({
                url: `/processos/financeiros/enviofinanceirotxt`,
                method: 'POST',
                data: {
                    task    : 'boletos',
                    empresa : empresa,
                    portador: portador,
                    ids     : ids,
                    guid    : guidBoleto
                }
            });

            clearInterval(progress);
            Ext.MessageBox.hide();
    
        } catch(error){ 
            clearInterval(progress);
            Ext.MessageBox.hide();  
            throw error;
        }
    },

    onEmailClick: async function(btn, e) {
        const view = this.getView();

        try {

            const movimento = this.getViewModel().get('movimento');
    
            const dataFinanceiro = (movimento.get('MOVIMENTOS_FINANCEIROS') || []);
            const titulos = dataFinanceiro.filter(titulo => {
                return (
                    titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                    titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
                );
            });
            
            const idsComNossoNumero = titulos.filter(titulo => titulo['FINANCEIROS_NOSSONUMERO'] > 0).map(titulo => titulo['FINANCEIROS_ID']).join(',');

            if(idsComNossoNumero.length == 0){
                throw 'Não há títulos a enviar';
            }

            const idPortador = titulos[0]['FINANCEIROS_ID_PORTADORES'];

            const emailA = (movimento.get('PESSOAS_EMAIL')  || '');
            const emailB = (movimento.get('PESSOAS_PAGINA') || '');
            const emailC = (movimento.get('PESSOAS_FANTASIA') || '');

            let listaEmails = '';
            if( SamosUtils.String.isEmail(emailA) ){ listaEmails += (emailA + ';') };
            if( SamosUtils.String.isEmail(emailB) ){ listaEmails += (emailB + ';') };
            if( SamosUtils.String.isEmail(emailC) ){ listaEmails += (emailC + ';') };

            let defaultEmail = listaEmails.slice(0, -1);
    
            const emails = await SamosUtils.Msg.prompt('Enviar Boleto por Email ', 'Confirme ou digite o email:', defaultEmail);
    
            if(emails === false) { return; }//cancelado pelo usuario
    
            if(!SamosUtils.String.isEmail(emails)) {
                throw 'Email inválido';
            }
            
            view.initGauge('Enviando email...');

            const layBoleto = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';
   
            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layBoleto}`,
                method: 'GET',
                data: {
                    ids: idsComNossoNumero,
                    empresa: configs.getEmpresa().id,
                    portador: idPortador
                }
            })

            const pdfAnexo = queryPDF.results[0]['name'];
            const cabecalho = `<table style="width:70%">
                <tr>
                <td width=10%><font size="3" color="back"><p>Emitente:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${movimento.get('EMPRESAS_FANTASIA') || ''} ${Ext.util.Format.TextMask.setMask('99.999.999/9999-99').mask(movimento.get('EMPRESAS_CPFCNPJ'))} ${movimento.get('EMPRESAS_TELEFONE') || ''}</p></font></td>
                <td width=20%></td>
                </tr>
                <tr>
                <td width=10%><font size="3" color="back"><p>Endere&ccedil;o:</p></font></td>
                <td width=70%><font size="3" color="red"><p>${movimento.get('EMPRESAS_ENDERECO') || ''}, ${movimento.get('EMPRESAS_NUMERO') || ''}, ${movimento.get('EMPRESAS_BAIRRO') || ''}, ${movimento.get('CIDADES_NOME') || ''}, ${movimento.get('CIDADES_ESTADO') || ''}</p></font></td>
                <td width=20%></td>
                </tr>
            </table>
            <br>`

            const corpo = `<table style="width:70%">
                <tr>
                    <td>
                    <font size="4" color="black"><p>Segue em anexo o PDF de seus boletos</p></font>
                    <table border="1" style="width:100%;background-color: #c1ddf1;">
                        <tr>
                            <td class="tabcenter" width=10%><b>Documento </b></td>
                            <td class="tabcenter" width=5%> <b>Parcela    </b></td>
                            <td class="tabcenter" width=15%><b>Vencimento</b></td>
                            <td class="tabcenter" width=15%><b>Valor     </b></td>
                            <td class="tabcenter" width=15%><b>CPF/CNPJ  </b></td>
                            <td class="tabcenter" width=40%><b>Nome      </b></td>
                        </tr>
                        ${
                            titulos.map(titulo => {
                                let cpfCnpj = movimento.get('PESSOAS_CPFCNPJ');
                                const vcto  = momentTz(titulo['FINANCEIROS_VENCIMENTO']).format('DD/MM/YYYY');
                                const valor = Ext.util.Format.MoneyMask.setMask('#9.999.990,00').mask(titulo['FINANCEIROS_ABERTO']);

                                if (cpfCnpj.length == 11) {
                                    cpfCnpj = Ext.util.Format.TextMask.setMask('999.999.999-99', false).mask(cpfCnpj);                                            
                                } else if (cpfCnpj.length == 14) {
                                    cpfCnpj = Ext.util.Format.TextMask.setMask('99.999.999/9999-99', false).mask(cpfCnpj);
                                }
                                return `<tr>
                                    <td class="tabcenter" width=10%><b>${titulo['FINANCEIROS_NUMERO']} </b></td>
                                    <td class="tabcenter" width=5%> <b>${titulo['FINANCEIROS_PARCELA']}</b></td>
                                    <td class="tabcenter" width=15%><b>${vcto}                             </b></td>
                                    <td class="tabcenter" width=15%><b>${valor}                            </b></td>
                                    <td class="tabcenter" width=15%><b>${cpfCnpj}                          </b></td>
                                    <td class="tabcenter" width=40%><b>${titulo['PESSOAS_NOME']}       </b></td>
                                </tr>`
                            })
                        }
                    </table>
                    </td>
                </tr>
                </table>`;
                    
            await SamosUtils.Email.enviar({
                emails:    emails,
                assunto:   configs.getEmpresa().nome + ' - Anexo boletos emitido para seu CPF/CNPJ',
                template:  'resources/email.html',
                cabecalho: cabecalho,
                corpo:     corpo,
                anexos:    [pdfAnexo]
            });

            Ext.Note('success', 'Email enviado com sucesso');

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        view.stopGauge();
    },

    onChequesClick: function (btn, e) {
        var formMovimento = this.getView().up('formmovimentos'),
            vmMovimento = formMovimento.getViewModel(),
            listCheques = Ext.create({
                xtype: 'formmovimentoscaixacheques'
            }),
            dataCheques = vmMovimento.get('model.MOVIMENTOS_CHEQUES'),
            dataModel = dataCheques ? vmMovimento.get('model').data : {};

        listCheques.getViewModel().set({
            movimento: vmMovimento.get('model'),
            model: Ext.create('SamosAdmin.movimentos.movimento.Model', dataModel),
            localData: vmMovimento.get('chequesLocalData'),
            dataCheques: dataCheques,
            readOnly: this.getViewModel().get('readOnly')
        });

        listCheques.lookup('prazo').setSearchedId(dataModel['MOVIMENTOS_ID_PRAZOS']);
        listCheques.focus();
        formMovimento.add(listCheques);
    },

    validarCheques: function() {
        var caixa = this.getViewModel().get('model'),
            vm = this.getViewModel();
            formMovimento = this.getView().up('formmovimentos'),
            movimento = formMovimento.getViewModel().get('model'),
            viewCheques = Ext.$('formmovimentoscaixacheques')[0],
            dataCheques = movimento.get('MOVIMENTOS_CHEQUES'),
            cheque      = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE')),
            isObrigatorio = vm.get('chequesObrigatorio');
            valorCheques = cheque,
            totalCheques = 0;

        let valid = false;
        const listCheques = Ext.$('formmovimentoscaixacheques')[0];

        if(valorCheques == 0 || !isObrigatorio) {
            movimento.set('MOVIMENTOS_CHEQUES', []);
            return true;

        } else {
            for(let i in dataCheques) {
                totalCheques += cents(dataCheques[i]['CHEQUES_VALOR']);
            }

            if(totalCheques != valorCheques) {
                if(viewCheques && viewCheques.isVisible(true)){
                    const diff = Ext.util.Format.maskRenderer('#9.990,00', true)((totalCheques - valorCheques) / 100);
                    Ext.Note('warning', (diff > 0 ? 'Faltam ' : 'Sobram ') + diff);
                }
                valid = false;
            } else {
                valid = true;
            }
        }

        if(valid) {
            if(listCheques && listCheques.isVisible(true)) {
                let ctrlCheques = listCheques.getController(); 
                Ext.defer(ctrlCheques.onSairClick, 400, ctrlCheques);
            }
        } else {
            if(listCheques && listCheques.isVisible(true)) {
                listCheques.focus();
            } else {
                this.onChequesClick(arguments);
            }
        }

        return valid;
    }
});
