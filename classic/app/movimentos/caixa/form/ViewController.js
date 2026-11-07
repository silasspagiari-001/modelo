Ext.define('SamosAdmin.movimentos.caixa.form.ViewController', {
    extend: 'SamosModule.form.ViewController',  
    alias: 'controller.formcaixa',

    mixins: {
        cartoes: 'SamosAdmin.movimentos.caixa.form.cartoes.Mixin',
        status:  'SamosAdmin.movimentos.caixa.form.mixins.Status'
    }, 

    initViewModel: function(vm) {  
        this.callParent(arguments);

        Ext.asap(() => {
            const emissaoAnt      = vm.get('model.MOVIMENTOSCAIXA_EMISSAO');
            const idPessoasAnt    = vm.get('model.MOVIMENTOSCAIXA_ID_PESSOAS');
            const idAplicacoesAnt = vm.get('model.MOVIMENTOSCAIXA_ID_APLICACOES');

            vm.get('model').set({
                'MOVIMENTOSCAIXA_EMISSAOANTIGO'       : emissaoAnt,
                'MOVIMENTOSCAIXA_ID_PESSOASANTIGO'    : idPessoasAnt,
                'MOVIMENTOSCAIXA_ID_APLICACOESANTIGO' : idAplicacoesAnt
            });
        });
    },

    onGravarClick: async function (btn, event) {
        const view = this.getView();

        try {
            const statusCaixa = Ext.$('caixa')[0].getViewModel().get('statusCaixa');
            const model = this.getRecord();
            
            await this.validarCabecalho();

            if(!this.validarData()) {
                this.lookup('emissao').focus(true);
                throw 'Data inválida';
            }
            
            if(!Caixa.services.Model.validar() && statusCaixa != 'fechado') {
                throw 'Informe o valor do Lançamento';
            }
            
            if (!this.mixins.cartoes.validarCartoes()) {
                throw 'Informe os valores cartão';
            }
            
            if (!this.validarCheques()) {
                throw 'Informe os valores cheques';
            }

            if (!this.validarAbertura()) {
                throw 'Caixa deve ser aberto com $ 100 em dinheiro';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                view.initGauge();
                this.colocarFilhosNoModel(model);
                const record = await model.save();
                this.onGravacaoSucesso(record);
            }
             
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao gravar o caixa');
        }

        view.stopGauge();
    },

    validarData: function() {
        const emissao = momentTz(this.lookup('emissao').getValue()).hours(0).minutes(0).seconds(0);
        const maxDate = momentServer().hours(0).minutes(0).seconds(0);

        return momentTz(emissao.format()).isSameOrBefore(maxDate);
    },

    onSairClick: function(btn, event) {
        this.callParent(arguments);
        
        if(this.getListView()) {
            this.getListView( ).getController( ).onBuscarClick();
        }
    },
    
    onReciboClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge();

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/recibo`,
                    method: 'GET',
                    data: {
                        empresa         : configs.getEmpresa().id,
                        emissao         : momentTz(this.lookup('emissao').getValue()).format('DD/MM/YYYY'),
                        id              : model.get('MOVIMENTOSCAIXA_ID'),
                        status          : 2,
                        incluirDuplicata: configs.getFinanceiros().exibirDuplicataNoCaixa !== false           
                    }
                });

                await SamosUtils.Utils.sleep(500);
                
                view.stopGauge();

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
            view.stopGauge();
        }
    },
    
    verificado: function() {
        return true;
    },

    validarCheques: function() {
        var caixa = this.getViewModel().get('model'),
            viewCheques = Ext.$('formcaixacheques')[0],
            dataCheques = caixa.get('MOVIMENTOSCAIXA_CHEQUES'),
            cheque      = cents(caixa.get('MOVIMENTOSCAIXA_CHEQUE')),
            tipoLancto  = caixa.get('MOVIMENTOSCAIXA_TIPO');
            isTransfer  = caixa.get('APLICACOES_NOME').toUpperCase().match(/TRANSFER/);
            valorCheques = cheque,
            totalCheques = 0;

        let valid = false;
        const listCheques = Ext.$('formcaixacheques')[0];


        if(caixa.get('MOVIMENTOSCAIXA_ID') > 0) {   // Se updating não mexe nos cheques
            return true;
        }

        if(valorCheques == 0 || tipoLancto == 'S' || isTransfer) {  // Só digitar cheques recebidos que não sejam transferências de saldo.
            caixa.set('MOVIMENTOSCAIXA_CHEQUES', []);
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
    },

    validarAbertura: function() {
        var caixa = this.getViewModel().get('model');
 
        if(!caixa.get('ABERTURA_CAIXA') || configs.getClientName() != 'prudenmoveis') { // Se não for abertura
            return true;
        }

        if(caixa.get('ABERTURA_CAIXA') == 'T' && 
           cents(caixa.get('MOVIMENTOSCAIXA_DINHEIRO')) != 10000) {  // Obrigatoriamente deve abrir com $ 100
            return false;
        }

        return true;

    },
    
    onChequesClick: function (btn, e) {
        var vmCaixa = this.getViewModel(),
            formCaixa = Ext.$('formcaixa')[0],
            listCheques = Ext.create({ 
                xtype: 'formcaixacheques'
            }),
            dataCheques = vmCaixa.get('model.MOVIMENTOSCAIXA_CHEQUES'),
            dataModel = dataCheques ? vmCaixa.get('model').data : {};

        listCheques.getViewModel().set({
            caixa: vmCaixa.get('model'),
            model: Ext.create('SamosAdmin.movimentos.caixa.Model', dataModel),
            localData: vmCaixa.get('chequesLocalData'),
            dataCheques: dataCheques,
            readOnly: this.getViewModel().get('readOnly')
        });

        listCheques.lookup('prazo').setSearchedId(dataModel['MOVIMENTOSCAIXA_ID_PRAZOS']);
        listCheques.focus();
        formCaixa.add(listCheques);
    }   
});
