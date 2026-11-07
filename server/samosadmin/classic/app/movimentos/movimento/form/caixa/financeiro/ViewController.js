Ext.define('SamosAdmin.movimentos.movimento.form.caixa.financeiro.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formmovimentoscaixafinanceiro',

    loadFinanceiro: function() {
        var loader = setInterval(() => {
            let vm = this.getViewModel(),
                store = vm.getStore('main'),
                data = vm.get('dataFinanceiro'),
                localData = vm.get('localData');

            if(store) {
                clearTimeout(loader);

                if(localData && localData[0]){
                    for (let i in localData[0]) {
                        for (let j in localData[0][i]) {
                            data[i][j] = localData[0][i][j];
                        }
                    }
                }

                store.setData(data);

                if(!vm.get('readOnly')){
                    this.getView().focus();
                }
            }  
        }, 800);
    },

    copiarOriginalParaAberto: function(txt, griditem) {
        const form = txt.up('form');

        if(form) {
            const values = form.getValues();
    
            values['FINANCEIROS_ABERTO'] = values['FINANCEIROS_ORIGINAL'];
    
            form.getForm().setValues(values);
        }
    },

    onAlterarClick: function() {
        const titulos = this.lookup('financeiro').getStore().data.items;

        if (titulos && titulos.some(titulo => parseInt(titulo.get('FINANCEIROS_NOSSONUMERO')))) {
            Ext.Note('warning', 'Os boletos já foram impressos!', 4000)
        } else if (titulos && titulos.some(titulo => {
            return cents(titulo.get('FINANCEIROS_ABERTO')) != cents(titulo.get('FINANCEIROS_ORIGINAL'));
        })) {
            Ext.Note('warning', 'Há títulos com baixas/ocorrências!', 4000)
        } else {
            this.getViewModel().set('readOnly', false);
        }
    },

    onConfirmarClick: function(btn, e) {
        this.lookup('financeiro').finalizarEdicao();

        if(this.validarFinanceiro()){
            const titulos = this.lookup('financeiro').getStore().data.items;
            const formMovimento = this.getView().up('formmovimentos');
            const ctrlMovimento = formMovimento.getController();
            const vmMovimento = formMovimento.getViewModel();
            const movimento = vmMovimento.get('model');
            const financeiras = (movimento.get('MOVIMENTOS_FINANCEIROS') || []).filter(titulo => {
                return (
                    titulo['PESSOAS_TIPO'] == configs.getFinanceiros().tipoFinanceira ||
                    titulo['FINANCEIROS_ID_PESSOAS'] == '999999'
                );
            });
            const callback = typeof e == 'function' ? e : undefined;
            
            this.localData = [];
   
            const jsonTitulos = titulos.map((financeiro, index) => {
                const obsFinanceiro = financeiro.get('FINANCEIROS_OBSERVACOES');
                financeiro.set('FINANCEIROS_ABERTO', financeiro.get('FINANCEIROS_ORIGINAL'));
                financeiro.set('FINANCEIROS_ID_APLICACOES', movimento.get('MOVIMENTOS_ID_APLICACOES'));
                financeiro.set('FINANCEIROS_ID_CUSTOS', movimento.get('MOVIMENTOS_ID_CUSTOS'));
                financeiro.set('FINANCEIROS_OBSERVACOES', obsFinanceiro);
                financeiro.getFields()
                    .filter(field => field.type == 'nodejsdate')
                    .map(field => {
                        financeiro.set(field.name, momentTz(financeiro.get(field.name)).format('YYYY-MM-DD'));
                    });
    
                return SamosUtils.Json.trocarAspasDuplasPorDuasSimples(financeiro.data);
            });
            
            const jsonItems = jsonTitulos.concat(financeiras);
    
            movimento.set({
                'MOVIMENTOS_FINANCEIROS': jsonItems,
                'MOVIMENTOS_ID_PRAZOS': this.getViewModel().get('model.MOVIMENTOS_ID_PRAZOS'),
                'PRAZOS_NOME': this.getViewModel().get('model.PRAZOS_NOME'),
                'PRAZOS_PARCELAS': this.getViewModel().get('model.PRAZOS_PARCELAS')
            });
    
            vmMovimento.set('financeiroLocalData', this.localData);
            
            if(btn.getText() == 'Gravar'){
                callback(movimento);
            } else {
                this.onSairClick();
    
                if(!Ext.$('formmovimentoscaixa')[0] || !Ext.$('formmovimentoscaixa')[0].isVisible(true)) {
                    ctrlMovimento.onFecharClick.call(ctrlMovimento);
                }
            }
        }
    },

    onGravarClick: async function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const vmMovimento = formMovimento.getViewModel();
        
        if(!this.validarFinanceiro()){ return; }

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
            this.onConfirmarClick(btn, movimento => {
                this.getView().initGauge('Gravando...');
                ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
    
                if(
                    Movimento.services.Caixa.receberObrigatorio() &&
                    Movimento.services.Caixa.financeiroValido()
                ) {
                    if(!formMovimento.getViewModel().get('isNotaEletronica')) {
                        movimento.set({
                            'MOVIMENTOS_LOG': SamosUtils.Info.getLog(),
                            'MOVIMENTOS_STATUS': 'F'
                        });
                    }
    
                    const btnCaixa = formMovimento.down('button[text="Caixa"]');
    
                    if(btnCaixa) {
                        btnCaixa.getEl().dom.style.backgroundColor = '';
                        btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                    }
    
                    if(!formMovimento.getViewModel().get('isNotaEletronica')) {
                        const temEntradaSaida = momentTz(movimento.get('MOVIMENTOS_ENTRADASAIDA') || '1899-12-30').isAfter('1900-01-01');
        
                        if(!vmMovimento.get('isNotaEntrada') && !temEntradaSaida) {
                            movimento.set('MOVIMENTOS_ENTRADASAIDA', momentServer().format('YYYY-MM-DD'));
                        }
                    }
                }
    
                let btnFinanceiro;
    
                if(vmMovimento.get('isNotaEntrada') || vmMovimento.get('isRequisicaoEntrada')) {
                    btnFinanceiro = Ext.$('formmovimentos')[0].down('button[text="Financeiro"]');
                } else {
                    btnFinanceiro = Ext.$('formmovimentoscaixa')[0].down('button[text="Financeiro"]');
                }
    
                if(btnFinanceiro) {
                    btnFinanceiro.getEl().dom.style.backgroundColor = '';
                    btnFinanceiro.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                }
                
                movimento.save()
                    .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                    .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                    .finally(() => {
                        ctrlMovimento.aposGravar.call(ctrlMovimento);
                        this.onSairClick();
                    });
            });
        }
    },
    
    gerarFinanceiro: function(txt, modelPrazo) {
        
        const formMovimento = this.getView().up('formmovimentos');
        const grid          = this.lookup('financeiro');
        const movimento     = formMovimento.getViewModel().get('model');
        const multiPortador = (configs.getFinanceiros().portadores || []).filter(empresa => empresa[2] == configs.getEmpresa().id).length > 0;

        if(multiPortador) {
            if(cents(movimento.get('PORTADORES_ID')) == 0) {
                Ext.Note('warning', `Selecione um portador para os títulos`);                
            }
        }

        const valorST     = cents(movimento.get('MOVIMENTOS_VALORST'));
        const baixaVista  = movimento.get('OPERACOES_BAIXAVISTA') == 'T';
        let valorDinheiro = 0;
        let valorCheque   = 0;
        let valorDebito   = 0;
        let valorCredito  = 0;
        let valorPix      = 0;
        let parcelas      = modelPrazo.get('PRAZOS_PARCELAS');
        let parcelamento  = modelPrazo.get('PRAZOS_PARCELAMENTO') ? modelPrazo.get('PRAZOS_PARCELAMENTO').split('#').filter(n => parseInt(n).toString() != 'NaN') : undefined;
        let vctoFixo      = movimento.get('VCTO_FIXO') || 0;
        const valorFinanceiro = cents(this.getViewModel().get('valorFinanceiro'));
        const totalMovimento = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_VALORRETENCAO'));
        const store = this.getViewModel().getStore('main');
        const frete = cents(movimento.get('MOVIMENTOS_FRETE'));
        const seguro = configs.getMovimentos().usarMarkup ? 0 : cents(movimento.get('MOVIMENTOS_SEGURO'));
        const despesas = cents(movimento.get('MOVIMENTOS_DESPESAS'));        
        const valorLiquido = configs.getClientName().match(/santana|turbotec/) ? totalMovimento - (valorST + frete + seguro + despesas) :
                             totalMovimento - (frete + seguro + despesas);
        
        const formCaixa = Ext.$('formmovimentoscaixa')[0] || '';

        if(formCaixa) {
            const caixa   = formCaixa.getViewModel().get('model');
            valorDinheiro = cents(caixa.get('MOVIMENTOSCAIXA_DINHEIRO'));
            valorCheque   = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE'));
            valorDebito   = cents(caixa.get('MOVIMENTOSCAIXA_DEBITO'));
            valorCredito  = cents(caixa.get('MOVIMENTOSCAIXA_CREDITO'));        
            valorPix      = cents(caixa.get('MOVIMENTOSCAIXA_TRANSFERENCIAS'));        
        }

        grid.removeAllItems();
        grid.removerLinhasEmBranco();

        if(!parcelamento || vctoFixo > 0) {
            parcelamento = [];
            for (let i = 0; i < parcelas; i++) {
                parcelamento.push(i * 30);
            }
        }

        const apenasFinanceiro = totalMovimento == valorFinanceiro;
        const apenasDinheiro   = totalMovimento == valorDinheiro;
        const apenasCheque     = totalMovimento == valorCheque;
        const apenasDebito     = totalMovimento == valorDebito;
        const apenasCredito    = totalMovimento == valorCredito;
        const apenasPix        = totalMovimento == valorPix;

        const resto = (apenasFinanceiro ? valorLiquido : valorFinanceiro) % parcelamento.length;
        let somaParcelas = 0;

        const dataFinanceiro = parcelamento.map((days, index) => {
            const hoje = momentServer().hours(0).minutes(0).seconds(0);
            const emissao = momentTz(movimento.get('MOVIMENTOS_EMISSAO')).hours(0).minutes(0).seconds(0);
            const isNotaEntrada = formMovimento.getViewModel().get('isNotaEntrada');
            const isRequisicaoEntrada = formMovimento.getViewModel().get('isRequisicaoEntrada');
            let percParcelas = [];

            if(configs.getClientName() == 'hermes') {  // Hermes usa parcelamento variável
                if(parcelas == 2) { percParcelas = [49.95, 50.05]; }
                if(parcelas == 3) { percParcelas = [33.30, 33.34, 33.36]; }
                if(parcelas == 4) { percParcelas = [24.95, 24.97, 25, 25.08]; }
                if(parcelas == 5) { percParcelas = [19.90, 19.95, 20, 20.05, 20.10]; }
                if(parcelas == 6) { percParcelas = [16.55, 16.60, 16.65, 16.70, 16.73, 16.77]; }
                if(parcelas == 7) { percParcelas = [14.20, 14.23, 14.26, 14.29, 14.32, 14.34, 14.36]; }                
            }

            let vcto;

            if(vctoFixo > 0) {
                vcto = momentTz(hoje).date(vctoFixo).add((index + 1), 'months');
            } else {
                if(isNotaEntrada || isRequisicaoEntrada) {
                    vcto = momentTz(emissao).add(days, 'days');
                } else {
                    vcto = momentTz(hoje).add(days, 'days');
                }    
            }
            
            const geraBaixado = configs.getClientName() == 'hermes' ? '' : (baixaVista && momentTz(vcto.format()).isSameOrBefore(hoje));

            let original;
            let idPortador;
            let nmPortador;

            if(configs.getClientName() == 'racaforte' ||
               configs.getClientName() == 'hospitalar' ||
               configs.getClientName() == 'herbiquimica') {
                if(apenasFinanceiro) {
                    idPortador = (configs.getEmpresa().portador || 1),
                    nmPortador = configs.getPermissao()['PORTADORES_NOME'];
                }
            }

            if(apenasDinheiro) {
                idPortador = configs.getFinanceiros().duplicata.portadorDinheiro || 1;
                nmPortador = 'DINHEIRO';
            }
            if(apenasCheque) {
                idPortador = configs.getFinanceiros().duplicata.portadorCheque || 1;
                nmPortador = 'CHEQUE';
            }
            if(apenasDebito) {
                idPortador = configs.getFinanceiros().duplicata.portadorDebito || 1;
                nmPortador = 'CARTAO DEBITO';
            }
            if(apenasCredito) {
                idPortador = configs.getFinanceiros().duplicata.portadorCredito || 1;
                nmPortador = 'CARTAO CREDITO';
            }      
            
            if(configs.getClientName() == 'hermes') {
                if(percParcelas.length > 0) {
                    let percTitulo = (cents(percParcelas[index]) / 100);
                    if(apenasFinanceiro){
                        original = Math.round(((valorLiquido * cents(percTitulo)) / 10000)) + (index === 0 ? frete + seguro + despesas: 0);
                    } else {
                        original = cents(parseInt(valorFinanceiro * cents(percTitulo)) / 10000);
                    }    
                } else {
                    if(apenasFinanceiro){
                        original = cents(parseInt(valorLiquido / parcelas) / 100) + (index === 0 ? resto + frete + seguro + despesas: 0);
                    } else {
                        original = cents(parseInt(valorFinanceiro / parcelas) / 100) + (index === 0 ? resto : 0);
                    }    
                }
                somaParcelas += (cents(original) / 100);
            } else {
                if(configs.getClientName().match(/santana|turbotec/)){
                    if(apenasFinanceiro){
                        original = cents(parseInt(valorLiquido / parcelas) / 100) + (index === 0 ? valorST + resto + frete + seguro + despesas: 0);
                    } else {
                        original = cents(parseInt(valorFinanceiro / parcelas) / 100) + (index === 0 ? resto : 0);
                    }
    
                } else{
                    if(apenasFinanceiro){
                        original = cents(parseInt(valorLiquido / parcelas) / 100) + (index === 0 ? resto + frete + seguro + despesas: 0);
                    } else {
                        original = cents(parseInt(valorFinanceiro / parcelas) / 100) + (index === 0 ? resto : 0);
                    }
                }    
            }

            return Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID':            (index + 1) * -1,
                'FINANCEIROS_NUMERO':        movimento.get('MOVIMENTOS_NUMERO'), 
                'FINANCEIROS_SERIE':         movimento.get('MOVIMENTOS_SERIE'), 
                'FINANCEIROS_TIPO':          movimento.get('OPERACOES_FINANCEIRO'), 
                'FINANCEIROS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'), 
                'FINANCEIROS_ID_DOCUMENTOS': movimento.get('MOVIMENTOS_ID_DOCUMENTOS'), 
                'FINANCEIROS_ID_PESSOAS':    movimento.get('MOVIMENTOS_ID_PESSOAS'),
                'PESSOAS_TIPO':              'C',
                'FINANCEIROS_ID_USUARIOS':   movimento.get('MOVIMENTOS_ID_USUARIOS'), 
                'FINANCEIROS_ID_PORTADORES': idPortador,
                'PORTADORES_NOME':           nmPortador,
                'FINANCEIROS_ID_APLICACOES': movimento.get('MOVIMENTOS_ID_APLICACOES') || movimento.get('OPERACOES_ID_APLICACOES') || 1,
                'FINANCEIROS_ID_CUSTOS':     movimento.get('MOVIMENTOS_ID_CUSTOS') || 1,
                'FINANCEIROS_ID_PRAZOS':     modelPrazo.get('PRAZOS_ID'),
                'FINANCEIROS_PARCELAS':      modelPrazo.get('PRAZOS_PARCELAS'),
                'FINANCEIROS_PARCELA':       index + 1,
                'FINANCEIROS_EMISSAO':       emissao.format('YYYY-MM-DD'),
                'FINANCEIROS_VENCIMENTO':    vcto.format('YYYY-MM-DD'),
                'FINANCEIROS_BAIXA':         geraBaixado ? vcto.format('YYYY-MM-DD') : '1899-12-30',
                'FINANCEIROS_PAGAMENTO':     geraBaixado ? vcto.format('YYYY-MM-DD') : '1899-12-30',
                'FINANCEIROS_ORIGINAL':      original / 100,
                'FINANCEIROS_ABERTO':        geraBaixado ? 0 : (original / 100),
                'FINANCEIROS_PAGO':          geraBaixado ? (original / 100) : 0,
                'FINANCEIROS_TOTAL':         valorFinanceiro / 100,
                'FINANCEIROS_STATUS':        geraBaixado ? 'P' : 'A'
            });
        });

        store.setData(dataFinanceiro);

        setTimeout(() => {
            this.lookup('vencimento0').focus(true);
        }, 250);
    },

    validarFinanceiro: function() {

        const formMovimento = this.getView().up('formmovimentos');
        const vmMovimento = formMovimento.getViewModel();

        if(vmMovimento.get('isNotaEntrada') && configs.getClientName() == 'racaforte') {
            return true;
        }

        if((configs.getFinanceiros().portadores || []).filter(empresa => empresa[2] == configs.getEmpresa().id).length > 0) {
            if(cents(vmMovimento.get('model.PORTADORES_ID')) == 0) {
                Ext.Note('warning', `Selecione um portador para os títulos`);
                return false;    
            }
        }

        var dataFinanceiro = this.getViewModel().getStore('main').getData().items,
            valorFinanceiro = cents(this.getViewModel().get('valorFinanceiro')),
            totalFinanceiro = 0;

        let valid = false;

        for(let i in dataFinanceiro) {
            totalFinanceiro += cents(dataFinanceiro[i].get('FINANCEIROS_ORIGINAL'));
        }

        if(totalFinanceiro != valorFinanceiro) {
            const diff = Ext.util.Format.maskRenderer('R$ #9.990,00', true)(Math.abs((totalFinanceiro - valorFinanceiro) / 100));
            Ext.Note('warning', `Valor difere em ${diff}. Selecione o prazo novamente para recalcular.`);
            valid = false;
        } else {
            valid = true;
        }

        return valid;
    },

    getRecord: function() {
        return this.getViewModel().get('model');
    },

    validateModel: function() {
        var ctrlMovimento = this.getView().up('formmovimentos').getController();
        
        return ctrlMovimento.validateModel(arguments);
    }
});
