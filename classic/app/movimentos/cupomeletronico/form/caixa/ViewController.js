Ext.define('SamosAdmin.movimentos.cupomeletronico.form.caixa.ViewController', {
    extend: 'SamosAdmin.movimentos.cupomeletronico.form.ViewController',
    alias: 'controller.formcupomeletronicocaixa',

    mixins: {
        cartoes: 'SamosAdmin.movimentos.cupomeletronico.form.caixa.cartoes.Mixin'
    },

    initViewModel: function(vm) {  
        this.callParent(arguments);
        setTimeout(() => {
            const movimento = this.getView().up('formcupomeletronico').getViewModel().get('model');
            const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL'));
            const isVendaConsumidor = movimento.get('MOVIMENTOS_ID_PESSOAS') == movimento.get('DOCUMENTOS_ID_PESSOAS');

            const pagIdPessoas       = movimento.get('MOVIMENTOS_ID_PESSOAS');
            const pagCreditoPessoa   = cents(movimento.get('PESSOAS_CREDITO') || 0)
            const serie              = movimento.get('MOVIMENTOS_SERIE')  || '[NUMERO]';
            const numero             = movimento.get('MOVIMENTOS_NUMERO') || '[SERIE]';
            const creditoDigitado    = vm.get('model.MOVIMENTOSCAIXA_CREDITOPESSOA');

            const pagNome = serie + ' ' + numero + ' ' + movimento.get('MOVIMENTOS_NOME').toString().replace(/'/ig, '');

            vm.set('model.MOVIMENTOSCAIXA_ID_PESSOAS', pagIdPessoas);
            if(!creditoDigitado) {
                vm.set('model.MOVIMENTOSCAIXA_CREDITOPESSOA', (pagCreditoPessoa > totalMovimento && !isVendaConsumidor ? totalMovimento : pagCreditoPessoa) / 100);
            }
            vm.set('model.MOVIMENTOSCAIXA_EXPORTADO', 'N');
            vm.set('model.MOVIMENTOSCAIXA_NOME',      pagNome);
            vm.set('model.MOVIMENTOSCAIXA_TIPO',      'S');
        }, 500);
    },

    onGravarClick: async function(btn, e) {
        const formMovimento = this.getView().up('formcupomeletronico');
        const ctrlMovimento = formMovimento.getController();
        const movimento = formMovimento.getViewModel().get('model');
        const caixa = this.getViewModel().get('model');

        this.getView().initGauge('Gravando...');

        let valido = false;

        try {
            valido = await this.validarFinanceiro();

            if(valido) {
                valido = this.validarFinanceira();
            }

            if(valido) {
                valido = this.mixins.cartoes.validarCartoes();
            }

            if(valido) {
                valido = this.validarCheques();
            }

            if(valido) {
                valido = CupomEletronico.services.Caixa.validarReceber();
            }

            if(valido) {
                this.onSairClick();

                setTimeout(async () => {
                    try {
                        await ctrlMovimento.onGravarClick.call(ctrlMovimento);
    
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
        
                        if (caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS') > 0) {
                            SamosUtils.Request.nodeApi({
                                url: `/deposito`,
                                method: 'POST',
                                data: {
                                    pessoa:     movimento.get('MOVIMENTOS_ID_PESSOAS'),
                                    valor:      caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'),
                                    tipo:       caixa.get('MOVIMENTOSCAIXA_TIPO'),
                                    emissao:    caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                    vencimento: caixa.get('MOVIMENTOSCAIXA_EMISSAO'),
                                    nome:       movimento.get('MOVIMENTOS_NOME'),
                                    documento:  movimento.get('MOVIMENTOSCAIXA_DOCUMENTO') || `${movimento.get('MOVIMENTOS_NUMERO')}/${movimento.get('MOVIMENTOS_SERIE')}`,
                                    empresa:    movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                                    numero:     movimento.get('MOVIMENTOS_NUMERO'),
                                    serie:      movimento.get('MOVIMENTOS_SERIE'),
                                    log:        SamosUtils.Info.getLog()
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
        const formMovimento = this.getView().up('formcupomeletronico');
        const ctrlMovimento = formMovimento.getController();
            
        ctrlMovimento.mixins.cartoes.exibirJanelaCartoes();
    },
    
    onFinanceiroClick: function (btn, e) {
        const formMovimento = this.getView().up('formcupomeletronico');
        const vmMovimento   = formMovimento.getViewModel();
        const movimento     = vmMovimento.get('model');
        const listFinanceiro = Ext.create({
            xtype: 'formcupomeletronicocaixafinanceiro'
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
            
        listFinanceiro.getViewModel().set({
            valorFinanceiro: valorFinanceiro / 100,
            movimento: vmMovimento.get('model'),
            model: Ext.create('SamosAdmin.movimentos.cupomeletronico.Model', dataModel),
            localData: vmMovimento.get('financeiroLocalData'),
            dataFinanceiro: titulos,
            readOnly: this.getViewModel().get('readOnly')
        });

        listFinanceiro.lookup('prazo').setSearchedId(dataModel['MOVIMENTOS_ID_PRAZOS']);
        listFinanceiro.focus();
        formMovimento.add(listFinanceiro);
    },
    
    onFinanceiraClick: function (btn, e) {
        const formMovimento = Ext.$('formcupomeletronico')[0];
        const vmMovimento = formMovimento.getViewModel();
        const caixa = this.getViewModel().get('model');
        const valorFinanceira = cents(caixa.get('MOVIMENTOSCAIXA_OUTRO'));
        const movimento = vmMovimento.get('model');
        const dataFinanceiro = vmMovimento.get('model.MOVIMENTOS_FINANCEIROS') || [];
        const financeiras = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
            );
        });
        const financeiraExistente = financeiras && financeiras[0] ? financeiras[0] : {
            'FINANCEIROS_NUMERO':        movimento.get('MOVIMENTOS_NUMERO'), 
            'FINANCEIROS_SERIE':         movimento.get('MOVIMENTOS_SERIE'), 
            'FINANCEIROS_TIPO':          'S', 
            'FINANCEIROS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'), 
            'FINANCEIROS_ID_DOCUMENTOS': movimento.get('MOVIMENTOS_ID_DOCUMENTOS'), 
            'FINANCEIROS_ID_PESSOAS':    '',
            'PESSOAS_TIPO':              configs.getFinanceiros().tipoFinanceira,
            'FINANCEIROS_ID_USUARIOS':   movimento.get('MOVIMENTOS_ID_USUARIOS'),
            'FINANCEIROS_ID_PORTADORES': configs.getPermissao()['EMPRESAS_ID_PORTADORES'],
            'FINANCEIROS_ID_APLICACOES': 1,
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
            xtype: 'formcupomeletronicocaixafinanceira'
        });
        
        viewFinanceira.getViewModel().set({
            movimento: movimento,
            model: financeira,
            readOnly: this.getViewModel().get('readOnly')
        });

        viewFinanceira.focus(true);
        formMovimento.add(viewFinanceira);
    },

    validarTransferencia: function () {
        const caixa = this.getViewModel().get('model');

        if(cents(caixa.get('MOVIMENTOSCAIXA_ID_PORTADORES')) == 0) {
            Ext.Note('warning', 'Informe a conta para lançamento');
            return false;   
        }

        if(cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS')) == 0) {
            Ext.Note('warning', 'Não há valor a transferir');
            return false;            
        }

        return true;
    },

    validarFinanceiro: function() {
        const viewFinanceiro  = Ext.$('formcupomeletronicocaixafinanceiro')[0];
        const caixa           = this.getViewModel().get('model');
        const formMovimento   = this.getView().up('formcupomeletronico');
        const movimento       = formMovimento.getViewModel().get('model');
        const dataFinanceiro  = movimento.get('MOVIMENTOS_FINANCEIROS') || [];

        let valorFinanceiro = cents(caixa.get('MOVIMENTOSCAIXA_DUPLICATA')) + cents(caixa.get('MOVIMENTOSCAIXA_BOLETO'));
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
        const viewFinanceira = Ext.$('formcupomeletronicocaixafinanceira')[0];
        const caixa = this.getViewModel().get('model');
        const formMovimento = this.getView().up('formcupomeletronico');
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
                const titulos = dataFinanceiro.filter(titulo => {
                    return (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                        titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
                    );
                });
                
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
        var formMovimento = this.getView().up('formcupomeletronico'),
            vmMovimento = formMovimento.getViewModel(),
            listCheques = Ext.create({
                xtype: 'formcupomeletronicocaixacheques'
            }),
            dataCheques = vmMovimento.get('model.MOVIMENTOS_CHEQUES'),
            dataModel = dataCheques ? vmMovimento.get('model').data : {};

        listCheques.getViewModel().set({
            movimento: vmMovimento.get('model'),
            model: Ext.create('SamosAdmin.movimentos.cupomeletronico.Model', dataModel),
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
            formMovimento = this.getView().up('formcupomeletronico'),
            movimento = formMovimento.getViewModel().get('model'),
            viewCheques = Ext.$('formcupomeletronicocaixacheques')[0],
            dataCheques = movimento.get('MOVIMENTOS_CHEQUES'),
            cheque      = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE')),
            isObrigatorio = vm.get('chequesObrigatorio');
            valorCheques = cheque,
            totalCheques = 0;

        let valid = false;
        const listCheques = Ext.$('formcupomeletronicocaixacheques')[0];

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
