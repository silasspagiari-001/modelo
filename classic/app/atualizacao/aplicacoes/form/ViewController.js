Ext.define('SamosAdmin.atualizacao.aplicacoes.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formaplicacoes',

    onSelecionarAplicacaoGrid: async function(grid, record, item, index, e, eOpts){
        const view = this.getView();
        const model = this.getRecord();
        const mascaraSelecionada = record.get('APLICACOES_MASCARA');

        if( !model.isNew() ){
            return;
        }

        //Não permite subordinar a contas que tenham zero no segundo nivel, por exemplo 5.00.000 não pode deixar
        if( Number(mascaraSelecionada.split('.')[1]) == 0 ){
            Ext.Note('warning', 'Conta Sintética de nivel zero - não permitido');
            return;
        }

        const proximaMascara = await this.getProximaMascaraLivre( mascaraSelecionada );
        const campoNome = view.lookup('nome');
        model.set('APLICACOES_MASCARA', proximaMascara);
        model.set('APLICACOES_TIPO',    record.get('APLICACOES_TIPO'));
        Ext.defer( ()=>{
            campoNome.focus();
        }, 10, this );
    },

    getProximaMascaraLivre: async function(mascaraSelecionada){
        return new Promise( async(resolve)=>{
            const mascaraDividida = mascaraSelecionada.split('.');
            const ultimoNivel = mascaraDividida.slice(-1);

            //PEGAR A SOBRA 
            const nivelSintetico = mascaraDividida.slice(0, mascaraDividida.length-1).join('.');

            //DISPARAR BUSCA NO SQL, PEGAR O PROXIMO LIVRE
            //Obter todos os manifestos
            const queryMax = await SamosUtils.Request.nodeApi({
                url: `/consultas/maxmascaraaplicacao`,
                method: 'GET',
                query: {
                    conteudo: nivelSintetico
                }
            }); 

            const maxMascara = queryMax.results[0]['ULTIMO'];
            const maxMascaraSplit = maxMascara.split('.');
            const maxMascaraUltimoNivel = maxMascaraSplit.slice(-1)[0];
            const maxMascaraNivelSintetico = maxMascaraSplit.slice(0, maxMascaraSplit.length-1).join('.');

            const proximo = parseInt( maxMascaraUltimoNivel )+1;
            const lengthUltimoNivel = maxMascaraUltimoNivel.length;
            const finalConta = ('000000' + proximo.toString()).slice(lengthUltimoNivel * -1);
            const novaConta = `${maxMascaraNivelSintetico}.${finalConta}`;

            resolve(novaConta);
        } )
    },

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

    onExcluirClick: async function (btn, event) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
    
            if(!configs.getUsuario().privilegiado){
                const nivel = 1;
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
                model.getProxy().setExtraParam('senhaNivel', 'true');
            }

            //Verifica se tem lançamentos
            const queryLancamentosAplicacao = await SamosUtils.Request.nodeApi({
                url: `/consultas/getlancamentosaplicacaoanalitica`,
                method: 'GET',
                query: {
                    id: model.get('APLICACOES_ID'),
                    mascara: model.get('APLICACOES_MASCARA')
                }
            });

            if(queryLancamentosAplicacao.temLancamento == true){
                Ext.Note('warning', 'A aplicação possui lançamentos - não permitido');
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

    onGravarClick: async function () {
        const model = this.getRecord();
        const vm = this.getViewModel();
        const gridselecaplicacao = this.getView().lookupReference('gridselecaplicacao');

        model.set( 'APLICACOES_STATUS', 'A' );    

        if(model.get('APLICACOES_MASCARA') == '') {
            Ext.Note('warning', 'Informe selecione a Conta Sintética Superior na lista acima');
            return;
        }

        //Se a mascara for valida
        if( !SamosUtils.String.validarMascaraAplicacao(model.get('APLICACOES_MASCARA')) ){
            Ext.Note('warning', 'Formato máscara requerido: X.XX.XXX - não permitido');
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
