Ext.define('SamosAdmin.atualizacao.sinteticas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formsinteticas',

    onNovoClick: async function(btn, event) {
        const form = this.getView();
        const vm = this.getViewModel();

        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
        const listView = this.getListView();
        const previousModel = this.getRecord();
        const newModel = Ext.create(listView.modelName || this.$className.replace(/\.[a-z]*\.ViewController/, '.Model'));

        newModel.set(newModel.getIdProperty(), 0);

        this.cleanChilds();

        form.model = newModel;

        form.getViewModel().set({
            'model':         newModel,
            'initialValues': previousModel ? previousModel.getData() : {},
            'readOnly':      false,
            'previousModel': previousModel,
            'editionClosed': !form.down('button[text="Fechar"]')
        });

        SamosUtils.Events.enableWarnReload();

        if(tabpanel){
            tabpanel.setActiveTab(form);
        }

        this.doDefaultFocus();

        return form;
    },

    onChangeMascara: function(){

        if(configs.getClientName() == 'eleve') {
            return;
        }

        const view = this.getView(),
              model = view.model,
              campoMascara = view.lookup('mascara'),
              valorCampoMascara = Number( SamosUtils.String.onlyNumbers(campoMascara.getValue()[0]) ),
              campoTipo = view.lookup('tipo_aplicacao');

        if( valorCampoMascara >= 1 && valorCampoMascara < 5  ){
            campoTipo.setValue('Receita');
            model.set('APLICACOES_TIPO', 'R');

        }else if( valorCampoMascara >= 5 ){
            campoTipo.setValue('Despesa');
            model.set('APLICACOES_TIPO', 'D');
        }else{
            campoTipo.setValue('');
        }   
    },

    onExcluirClick: async function (btn, event) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
    
            if(!configs.getUsuario().privilegiado){
                const nivel = 1;
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
                model.getProxy().setExtraParam('senhaNivel', 'true');
            }

            
            const mascaraSplit = model.get('APLICACOES_MASCARA').split('.');
            const mascaraBase = mascaraSplit.slice(0, (mascaraSplit.length-1) ).join('.');

            //verificar se a mascara tem filhos
            const queryFilhosAplicacao = await SamosUtils.Request.nodeApi({
                url: `/consultas/getfilhosaplicacao`,
                method: 'GET',
                query: {
                    mascara: mascaraBase
                }
            });

            if( (queryFilhosAplicacao.results || []).length > 1 ){
                Ext.Note('warning', 'A aplicação possui filhos - não permitido');
                return;
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente excluir?')){
                view.initGauge('Excluindo...');
                this.colocarFilhosNoModel(model);
                await model.erase();

                if(this.getListView && this.getListView().down('grid')) {
                    this.getListView().down('grid').getStore().load();
                }

                Ext.Note('success', 'Registro excluído');

                await SamosUtils.Utils.sleep(500)

                this.onSairClick();
                
                if(this.getListView && this.getListView().down('grid')) {
                    this.getListView().down('toolbar').focus(true);
                }
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao excluir');
        }
        
        view.stopGauge();
    },

    /*
    onChangeTipo: function(combo, newValue, oldValue){
        const model = this.getRecord();
        model.set('APLICACOES_TIPO', newValue);
    },
    */

    onGravarClick: async function () {
        const model = this.getRecord();
        const vm = this.getViewModel();
        const list = Ext.$('sinteticas')[0],
              vmList = list.getViewModel();

        model.set( 'APLICACOES_STATUS', 'S' );    

        //Se o usuario começar errado
        if( model.get('APLICACOES_TIPO') == 'R' && (model.get('APLICACOES_MASCARA')[0] < 1 || model.get('APLICACOES_MASCARA')[0] > 4) ){ 
            Ext.Note('warning', 'O primeiro digito da máscara da receita precisar ser entre 1 e 4 - não permitido');
            return;
        }

        if( model.get('APLICACOES_TIPO') == 'D' && (model.get('APLICACOES_MASCARA')[0] < 5 || model.get('APLICACOES_MASCARA')[0] > 9) ){ 
            Ext.Note('warning', 'O primeiro digito da máscara da despesa precisar ser entre 5 e 9 - não permitido');
            return;
        }

        //Se a mascara for valida
        if( !SamosUtils.String.validarMascaraAplicacao(model.get('APLICACOES_MASCARA')) ){
            Ext.Note('warning', 'Formato máscara requerido: X.XX.XXX - não permitido');
            return;
        }

        //Se a mascara não termina com zero, ta errado
        if( !model.get('APLICACOES_MASCARA').endsWith('.000') ){
            Ext.Note('warning', 'O final da mascara precisa terminar com zeros - não permitido');
            return;
        }

        if( model.get('APLICACOES_MASCARA') != vm.get('ultimaConta') && vm.get('ultimaConta') != '' ){
            model.set({
                'APLICACOES_MASCARA': vm.get('ultimaConta')
            });
            Ext.Note('warning', 'Mascara fora do padrão - não permitido.');
            return;
        }

        //verificar se a mascara ja existe
        const queryMascara = await SamosUtils.Request.nodeApi({
            url: `/processos/executasql`,
            method: 'GET',
            query: {
                nomeSql: 'mascaraaplicacaoexiste',
                parametroSql: JSON.stringify({
                    mascara: model.get('APLICACOES_MASCARA')
                })
            }
        });

        if( (queryMascara.results || []).length > 0 && queryMascara.results[0]['APLICACOES_ID'] != model.get('APLICACOES_ID') ){
            Ext.Note('warning', 'Mascara já existe - não permitido.');
            return;
        }

        await this.validarCabecalho();

        if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')){
            try {
                this.getView().initGauge('Gravando...');
                this.colocarFilhosNoModel(model);
                const modelSalvo = await model.save();
                this.onGravacaoSucesso(modelSalvo);
            } catch (error) {
                this.onGravacaoFalha(error);
            }
            this.aposGravar();

            if(this.getView().resolve) {
                this.getView().resolve(model, this.getView())
            }
        }
    }
});
