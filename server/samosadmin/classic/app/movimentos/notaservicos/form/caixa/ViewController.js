Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.ViewController', {
    extend: 'SamosAdmin.movimentos.notaservicos.form.ViewController',
    alias: 'controller.formnotaservicoscaixa',

    mixins: {
        cartoes: 'SamosAdmin.movimentos.notaservicos.form.caixa.cartoes.Mixin'
    },

    initViewModel: function(vm) {  
        this.callParent(arguments);
        setTimeout(() => {
            const movimento = this.getView().up('formnotaservicos').getViewModel().get('model');
            const totalNota = cents(movimento.get('ORDENS_TOTAL'));
            const isVendaConsumidor = false;

            const pagIdPessoas       = movimento.get('ORDENS_ID_PESSOAS');
            const pagCreditoPessoa   = 0; //cents(movimento.get('PESSOAS_CREDITO') || 0)
            const serie              = movimento.get('ORDENS_SERIE')  || '[NUMERO]';
            const numero             = movimento.get('ORDENS_NUMERO') || '[SERIE]';
            const creditoDigitado    = vm.get('model.MOVIMENTOSCAIXA_CREDITOPESSOA');

            const pagNome = serie + ' ' + numero + ' ' + movimento.get('ORDENS_NOME').toString().replace(/'/ig, '');

            //vm.set('model.MOVIMENTOSCAIXA_ID_PESSOAS', pagIdPessoas);
            if(!creditoDigitado) {
                vm.set('model.MOVIMENTOSCAIXA_CREDITOPESSOA', (pagCreditoPessoa > totalNota && !isVendaConsumidor ? totalNota : pagCreditoPessoa) / 100);
            }
            vm.set('model.MOVIMENTOSCAIXA_EXPORTADO', 'N');
            vm.set('model.MOVIMENTOSCAIXA_NOME',      pagNome);
            vm.set('model.MOVIMENTOSCAIXA_TIPO',      'E');
        }, 500);
    },

    onGravarClick: async function(btn, e) {
        const formMovimento = this.getView().up('formnotaservicos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = formMovimento.getViewModel().get('model');
        const caixa = this.getViewModel().get('model');

        this.getView().initGauge('Gravando...');

        let valido = false;

        try {
            valido = await this.validarFinanceiro();

            if(valido) {
                valido = this.mixins.cartoes.validarCartoes();
            }

            if(valido) {
                valido = this.validarTransferencia();
            }

            if(valido) {
                valido = this.validarCheques();
            }

            if(valido) {
                valido = NotaServicos.services.Caixa.validarReceber();
            }

            if(valido) {
                this.onSairClick();

                setTimeout(async () => {
                    try {
                        await ctrlMovimento.onGravarClick.call(ctrlMovimento);
    
                        if (caixa.get('MOVIMENTOSCAIXA_CREDITOPESSOA') > 0) {
                            Caixa.services.CreditoPessoa.gravar({
                                pessoa:   movimento.get('ORDENS_ID_PESSOAS'),
                                valor:    caixa.get('MOVIMENTOSCAIXA_CREDITOPESSOA'),
                                tipo:     caixa.get('MOVIMENTOSCAIXA_TIPO'),
                                emissao:  caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                empresa:  movimento.get('ORDENS_ID_EMPRESAS'),
                                numero:   movimento.get('ORDENS_NUMERO'),
                                serie:    movimento.get('ORDENS_SERIE'),
                                log:      SamosUtils.Info.getLog()
                            });
                        }
        
                        if (caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS') > 0) {
                            SamosUtils.Request.nodeApi({
                                url: `/depositocorrente`,
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
                                    'CONTACORRENTES_OBSERVACOES':    '',
                                    'CONTACORRENTES_DEBITOCREDITO':  (caixa.get('MOVIMENTOSCAIXA_TIPO') == 'E' ? 'C' : 'D'),
                                    'CONTACORRENTES_FINANCEIRO':     'N',
                                    'CONTACORRENTES_VALOR':          caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'),           
                                    'CONTACORRENTES_LOG':            SamosUtils.Info.getLog()
                                }
                            });
                        }
                        
                    } catch (error) {
                        console.log(error);
                    }
                }, 500)
                
            } else {
                this.getView().stopGauge();
            }
            
        } catch (error) {
            console.error(error)
        }
    },

    onCancelarClick: function(btn, event) {
        this.getViewModel().set('model', undefined);
        this.cancelar();
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },
    
    onCartoesClick: function (btn, e) {
        const formMovimento = this.getView().up('formnotaservicos');
        const ctrlMovimento = formMovimento.getController();
            
        ctrlMovimento.mixins.cartoes.exibirJanelaCartoes();
    },
    
    onFinanceiroClick: function (btn, e) {
        const formMovimento = this.getView().up('formnotaservicos');
        const vmMovimento   = formMovimento.getViewModel();
        const movimento     = vmMovimento.get('model');
        const listFinanceiro = Ext.create({
            xtype: 'formnotaservicoscaixafinanceiro'
        });
        const dataFinanceiro = vmMovimento.get('model.ORDENS_FINANCEIROS') || [];
        const dataModel = dataFinanceiro ? vmMovimento.get('model').data : {};
        const caixa = this.getViewModel().get('model');
        let valorFinanceiro = cents(caixa.get('MOVIMENTOSCAIXA_DUPLICATA')) + cents(caixa.get('MOVIMENTOSCAIXA_BOLETO'))
            
        listFinanceiro.getViewModel().set({
            valorFinanceiro: valorFinanceiro / 100,
            movimento: vmMovimento.get('model'),
            model: Ext.create('SamosAdmin.movimentos.notaservicos.Model', dataModel),
            localData: vmMovimento.get('financeiroLocalData'),
            dataFinanceiro: dataFinanceiro,
            readOnly: this.getViewModel().get('readOnly')
        });

        listFinanceiro.lookup('prazo').setSearchedId(dataModel['ORDENS_ID_PRAZOS']);
        listFinanceiro.focus();
        formMovimento.add(listFinanceiro);
    },
    
    validarTransferencia: function () {
        const caixa = this.getViewModel().get('model');

        if(cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS')) == 0) {
            const formNotaservicos = this.getView().up('formnotaservicos');
            const vmNotaservicos   = formNotaservicos.getViewModel();
            const notaservico     = vmNotaservicos.get('model');                
            caixa.set('MOVIMENTOSCAIXA_ID_PESSOAS', notaservico.get('ORDENS_ID_PESSOAS'));
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
        const viewFinanceiro  = Ext.$('formnotaservicoscaixafinanceiro')[0];
        const caixa           = this.getViewModel().get('model');
        const formMovimento   = this.getView().up('formnotaservicos');
        const movimento       = formMovimento.getViewModel().get('model');
        const titulos         = movimento.get('ORDENS_FINANCEIROS') || [];

        let valorFinanceiro = cents(caixa.get('MOVIMENTOSCAIXA_DUPLICATA')) + cents(caixa.get('MOVIMENTOSCAIXA_BOLETO'));
        let valid = false;

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
    
    onBoletoClick: async function(btn, e) {
        const view = this.getView();

        try {
            const movimento = this.getViewModel().get('movimento');
    
            if(await SamosUtils.Msg.confirm('Deseja realmente emitir o boleto?')) {
                view.initGauge('Gerando arquivo para impressão...');
    
                const titulos = (movimento.get('ORDENS_FINANCEIROS') || []);
                
                const ids = titulos.map(titulo => titulo['FINANCEIROS_ID']).join(',');
    
                const idsSemNossoNumero = titulos.filter(titulo => !titulo['FINANCEIROS_NOSSONUMERO']).map(titulo => titulo['FINANCEIROS_ID']).join(',');

                if(idsSemNossoNumero.length > 0) {
                    await this.gerarNossoNumero(idsSemNossoNumero, configs.getPermissao()['EMPRESAS_ID_PORTADORES']);
                }
  
                const layBoleto = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/${layBoleto}`,
                    method: 'GET',
                    data: {
                        ids: ids,
                        empresa: configs.getEmpresa().id,
                        portador: titulos[0]['FINANCEIROS_ID_PORTADORES']
                    }
                });

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

    onChequesClick: function (btn, e) {
        var formMovimento = this.getView().up('formnotaservicos'),
            vmMovimento = formMovimento.getViewModel(),
            listCheques = Ext.create({
                xtype: 'formnotaservicoscaixacheques'
            }),
            dataCheques = vmMovimento.get('model.ORDENS_CHEQUES'),
            dataModel = dataCheques ? vmMovimento.get('model').data : {};

        listCheques.getViewModel().set({
            movimento: vmMovimento.get('model'),
            model: Ext.create('SamosAdmin.movimentos.notaservicos.Model', dataModel),
            localData: vmMovimento.get('chequesLocalData'),
            dataCheques: dataCheques,
            readOnly: this.getViewModel().get('readOnly')
        });

        listCheques.lookup('prazo').setSearchedId(dataModel['ORDENS_ID_PRAZOS']);
        listCheques.focus();
        formMovimento.add(listCheques);
    },

    validarCheques: function() {
        var caixa = this.getViewModel().get('model'),
            vm = this.getViewModel();
            formMovimento = this.getView().up('formnotaservicos'),
            movimento = formMovimento.getViewModel().get('model'),
            viewCheques = Ext.$('formnotaservicoscaixacheques')[0],
            dataCheques = movimento.get('ORDENS_CHEQUES'),
            cheque      = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE')),
            isObrigatorio = vm.get('chequesObrigatorio');
            valorCheques = cheque,
            totalCheques = 0;

        let valid = false;
        const listCheques = Ext.$('formnotaservicoscaixacheques')[0];

        if(valorCheques == 0 || !isObrigatorio) {
            movimento.set('ORDENS_CHEQUES', []);
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
