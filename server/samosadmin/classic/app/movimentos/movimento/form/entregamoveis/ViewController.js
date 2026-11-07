Ext.define('SamosAdmin.movimentos.movimento.form.entregamoveis.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentosentregamoveis',

    initViewModel: function(vm) {  
        this.callParent(arguments);
        setTimeout(() => {

            const temMontagem = vm.get('temMontagem');            

            if(temMontagem) { 
                if(vm.get('model.MOVIMENTOSITENS_DATAMONTAGEM') == '1899-12-30') {
                    vm.set('model.MOVIMENTOSITENS_DATAMONTAGEM', momentServer().add(5, 'days').format('YYYY-MM-DD'))
                }
            }
        }, 500);
    },

    onConfirmarClick: function (btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
        const callback = typeof e =='function' ? e : undefined;

        if(this.validarDatasETurnos() && Movimento.services.EntregaMoveis.validar()){
            ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
            ctrlMovimento.getViewModel().set('entregaValida', true);

            if(btn.getText() == 'Gravar'){
                callback();
            } else {
                Ext.defer(ctrlMovimento.onFecharClick, 200, ctrlMovimento);
                Ext.defer(this.onSairClick, 500, this);
            }
        }
    },

    onImprimirClick: async function(){
        const view = this.getView();
        const formMovimento = this.getView().up('formmovimentos');
        const modelImpressao = formMovimento.getViewModel().get('model')        
        const jaImpresso = modelImpressao.get('MOVIMENTOS_PROTOCOLO') == 'ENTREGA';

        if(
            configs.getMovimentos().senhaImpressao && 
            !configs.getUsuario().privilegiado &&
            jaImpresso
        ) {
            const nivel = 3; 
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {

            delete this.permiteImpressao;

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');
                const id = modelImpressao.get('MOVIMENTOS_ID');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/comprovantemoveis/${id}`,
                    method: 'GET'
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

                this.onSairClick();                        
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
            
        this.onConfirmarClick(btn, () => {
            Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                if (btn == 'yes') {
                    const movimento = ctrlMovimento.getRecord();
                    this.getView().initGauge('Gravando...');
                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento, false);

                    movimento.data['MOVIMENTOS_ITENS'].forEach(item => {
                        item['MOVIMENTOSITENS_DATAENTREGA']  = momentTz(item['MOVIMENTOSITENS_DATAENTREGA']).format('YYYY-MM-DD');
                        item['MOVIMENTOSITENS_DATAMONTAGEM'] = momentTz(item['MOVIMENTOSITENS_DATAMONTAGEM']).format('YYYY-MM-DD');
                    });
                        
                    movimento.save()
                        .then(ctrlMovimento.onGravacaoSucesso.bind(ctrlMovimento))
                        .catch(ctrlMovimento.onGravacaoFalha.bind(ctrlMovimento))
                        .finally(() => {
                            ctrlMovimento.aposGravar.call(ctrlMovimento);
                            ctrlMovimento.setReadOnly.call(this, true);
                            this.getView().stopGauge();
                            Ext.defer(this.onSairClick, 500, this);
                        });
                }
            });
        });
    },

    validarDatasETurnos: function() {
        const model = this.getViewModel().get('model');
        const temMontagem = this.getViewModel().get('temMontagem');
        const formMovimento = this.getView().up('formmovimentos');        
        const dataEmissao   = formMovimento.getViewModel().get('model.MOVIMENTOS_EMISSAO');
        const dataEntrega   = momentTz(model['MOVIMENTOSITENS_DATAENTREGA']).hours(0).minutes(0).seconds(0);
        const dataMontagem  = momentTz(model['MOVIMENTOSITENS_DATAMONTAGEM']).hours(0).minutes(0).seconds(0);
        const turnoEntrega  = model['MOVIMENTOSITENS_HORAENTREGA'];
        const turnoMontagem = model['MOVIMENTOSITENS_HORAMONTAGEM'];

        if(!model['MOVIMENTOSITENS_DATAENTREGA']){
            Ext.Note('warning', 'Informe a data de entrega');
            this.lookup('dataentrega').focus(true);
            return false;
        } else if(momentTz(dataEntrega.format()).isBefore(dataEmissao)) {
            Ext.Note('warning', 'Data de entrega inválida');
            this.lookup('dataentrega').focus(true);
            return false;
        } else if(!turnoEntrega){
            Ext.Note('warning', 'Informe o turno de entrega');
            this.lookup('turnoentrega').focus(true);
            return false;
        }
        
        if(momentTz(dataEntrega.format()).isSame(momentServer().hours(0).minutes(0).seconds(0))){
            if(
                parseInt(momentServer().format('HH')) >= 12 &&
                parseInt(momentServer().format('HH')) < 18 &&
                turnoEntrega == 'M'
            ) {
                Ext.Note('warning', 'Entrega hoje somente à tarde/noite');
                this.lookup('turnoentrega').focus(true);
                return false;
            } else if(
                parseInt(momentServer().format('HH')) >= 18 &&
                (turnoEntrega == 'M' || turnoEntrega == 'T')
            ){
                Ext.Note('warning', 'Entrega hoje somente à noite');
                this.lookup('turnoentrega').focus(true);
                return false;
            }
        }

        if(temMontagem){
            if(!model['MOVIMENTOSITENS_DATAMONTAGEM']){
                Ext.Note('warning', 'Informe a data de montagem');
                this.lookup('datamontagem').focus(true);
                return false;
            } else if(momentTz(dataMontagem.format()).isBefore(dataEntrega)){
                Ext.Note('warning', 'Montagem somente após a entrega');
                this.lookup('datamontagem').focus(true);
                return false;
            } else if(!turnoMontagem){
                Ext.Note('warning', 'Informe o turno de montagem');
                this.lookup('turnomontagem').focus(true);
                return false;
            } else if(
                momentTz(dataMontagem.format()).isSame(dataEntrega.format()) &&
                (
                    (
                        (turnoEntrega == 'T' || turnoEntrega == 'N') && 
                        turnoMontagem == 'M'
                    ) || 
                    turnoEntrega == 'N' && turnoMontagem == 'T'
                )
            ){
                Ext.Note('warning', 'Montagem somente após a entrega');
                this.lookup('turnomontagem').focus(true);
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },

    onCancelarClick: function() {
        this.getViewModel().set('model', undefined);
        this.callParent(arguments);        
    },

    onAlterarClick: function() {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();

        if(!this.permiteAlteracao && (!configs.getUsuario().privilegiado && !configs.getClientName() == 'prudenmoveis') && !formMovimento.getViewModel().get('isOrcamento')){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteAlteracao = true;
                    movimento.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onAlterarClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else {
            const id      = movimento.get('MOVIMENTOS_ID');
            const numero  = movimento.get('MOVIMENTOS_NUMERO');
            const serie   = movimento.get('MOVIMENTOS_SERIE');
            const empresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

            movimento.getProxy().setExtraParam('log', `PUT /movimentos/entregamoveis/${id} (${numero}|${serie}|${empresa})`);
            this.getViewModel().set('readOnly', false);
            delete this.permiteAlteracao;
        }
    },

    onSairClick: function(){ 
        Movimento.services.EntregaMoveis.finalizar();
        this.callParent(arguments);
    }
});
