Ext.define('SamosAdmin.movimentos.notaservicos.form.caixa.financeiro.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.formnotaservicoscaixafinanceiro',

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
            const formNotaServicos = this.getView().up('formnotaservicos');
            const ctrlMovimento = formNotaServicos.getController();
            const vmNotaServicos = formNotaServicos.getViewModel();
            const notaservicos = vmNotaServicos.get('model');
            const callback = typeof e == 'function' ? e : undefined;
            
            this.localData = [];
   
            const jsonTitulos = titulos.map((financeiro, index) => {
                const obsFinanceiro = financeiro.get('FINANCEIROS_OBSERVACOES');
                financeiro.set('FINANCEIROS_ABERTO', financeiro.get('FINANCEIROS_ORIGINAL'));
                financeiro.set('FINANCEIROS_OBSERVACOES', obsFinanceiro);
                financeiro.getFields()
                    .filter(field => field.type == 'nodejsdate')
                    .map(field => {
                        financeiro.set(field.name, momentTz(financeiro.get(field.name)).format('YYYY-MM-DD'));
                    });
    
                return SamosUtils.Json.trocarAspasDuplasPorDuasSimples(financeiro.data);
            });
                
            notaservicos.set({
                'ORDENS_FINANCEIROS': jsonTitulos,
                'ORDENS_ID_PRAZOS': this.getViewModel().get('model.ORDENS_ID_PRAZOS'),
                'PRAZOS_NOME': this.getViewModel().get('model.PRAZOS_NOME'),
                'PRAZOS_PARCELAS': this.getViewModel().get('model.PRAZOS_PARCELAS')
            });
    
            vmNotaServicos.set('financeiroLocalData', this.localData);
            
            if(btn.getText() == 'Gravar'){
                callback(notaservicos);
            } else {
                this.onSairClick();
            }
        }
    },

    onGravarClick: async function(btn, e) {
        const formMovimento = this.getView().up('formnotaservicos');
        const ctrlMovimento = formMovimento.getController();
        const vmMovimento   = formMovimento.getViewModel();
        
        if(!this.validarFinanceiro()){ return; }

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
            this.onConfirmarClick(btn, movimento => {
                this.getView().initGauge('Gravando...');
                ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
    
                if(
                    NotaServicos.services.Caixa.financeiroValido()
                ) {
                    movimento.set({
                        'ORDENS_LOG': SamosUtils.Info.getLog(),
                        'ORDENS_STATUS': 'F'
                    });
    
                    const btnCaixa = formMovimento.down('button[text="Caixa"]');
    
                    if(btnCaixa) {
                        btnCaixa.getEl().dom.style.backgroundColor = '';
                        btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                    }
    
                    const temEntradaSaida = momentTz(movimento.get('ORDENS_FECHAMENTO') || '1899-12-30').isAfter('1900-01-01');
    
                    if(!temEntradaSaida) {
                        movimento.set('ORDENS_FECHAMENTO', momentServer().format('YYYY-MM-DD'));
                    }
                }
    
                const btnFinanceiro = Ext.$('formnotaservicoscaixa')[0].down('button[text="Financeiro"]');
    
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
        const formMovimento = this.getView().up('formnotaservicos');
        const grid = this.lookup('financeiro');
        const movimento = formMovimento.getViewModel().get('model');
        let parcelas = modelPrazo.get('PRAZOS_PARCELAS');
        let parcelamento = modelPrazo.get('PRAZOS_PARCELAMENTO') ? modelPrazo.get('PRAZOS_PARCELAMENTO').split('#').filter(n => parseInt(n).toString() != 'NaN') : undefined;
        const valorFinanceiro = cents(this.getViewModel().get('valorFinanceiro'));
        const totalMovimento = cents(movimento.get('ORDENS_TOTAL'));
        const store = this.getViewModel().getStore('main');
        const valorLiquido = totalMovimento;

        grid.removeAllItems();
        grid.removerLinhasEmBranco();

        if(!parcelamento) {
            parcelamento = [];
            for (let i = 0; i < parcelas; i++) {
                parcelamento.push(i * 30);
            }
        }

        const apenasFinanceiro = totalMovimento == valorFinanceiro;
        const resto = (apenasFinanceiro ? valorLiquido : valorFinanceiro) % parcelamento.length;

        const dataFinanceiro = parcelamento.map((days, index) => {
            const hoje = momentServer().hours(0).minutes(0).seconds(0);
            const vcto = momentTz(hoje).add(days, 'days');

            let original;

            if(apenasFinanceiro){
                original = cents(parseInt(valorLiquido / parcelas) / 100) + (index === 0 ? resto : 0);
            } else {
                original = cents(parseInt(valorFinanceiro / parcelas) / 100) + (index === 0 ? resto : 0);
            }

            return Ext.create('SamosFinanceiros.titulos.Model', {
                'FINANCEIROS_ID':            (index + 1) * -1,
                'FINANCEIROS_NUMERO':        movimento.get('ORDENS_NUMERO'), 
                'FINANCEIROS_SERIE':         movimento.get('ORDENS_SERIE'), 
                'FINANCEIROS_TIPO':          movimento.get('OPERACOES_FINANCEIRO'),
                'FINANCEIROS_ID_ORDENS':     movimento.get('ORDENS_ID'), 
                'FINANCEIROS_ID_DOCUMENTOS': movimento.get('ORDENS_ID_DOCUMENTOS'), 
                'FINANCEIROS_ID_PESSOAS':    movimento.get('ORDENS_ID_PESSOAS'),
                'PESSOAS_TIPO':              'C',
                'FINANCEIROS_ID_USUARIOS':   movimento.get('MOVIMENTOS_ID_USUARIOS'), 
                'FINANCEIROS_ID_PORTADORES': configs.getPermissao()['EMPRESAS_ID_PORTADORES'],
                'PORTADORES_NOME':           'CARTEIRA',
                'FINANCEIROS_ID_APLICACOES': 1,
                'FINANCEIROS_ID_CUSTOS':     1,
                'FINANCEIROS_ID_PRAZOS':     modelPrazo.get('PRAZOS_ID'),
                'FINANCEIROS_PARCELAS':      modelPrazo.get('PRAZOS_PARCELAS'),
                'FINANCEIROS_PARCELA':       index + 1,
                'FINANCEIROS_EMISSAO':       momentServer().format('YYYY-MM-DD'),
                'FINANCEIROS_VENCIMENTO':    vcto.format('YYYY-MM-DD'),
                'FINANCEIROS_BAIXA':         '1899-12-30',
                'FINANCEIROS_PAGAMENTO':     '1899-12-30',
                'FINANCEIROS_ORIGINAL':      original / 100,
                'FINANCEIROS_ABERTO':        original / 100,
                'FINANCEIROS_PAGO':          0,
                'FINANCEIROS_TOTAL':         valorFinanceiro / 100,
                'FINANCEIROS_STATUS':        'A'
            });
        });

        store.setData(dataFinanceiro);

        setTimeout(() => {
            this.lookup('vencimento0').focus(true);
        }, 250);
    },

    validarFinanceiro: function() {
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
        const ctrlMovimento = this.getView().up('formnotaservicos').getController();
        
        return ctrlMovimento.validateModel(arguments);
    }
});
