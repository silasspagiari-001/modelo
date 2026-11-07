Ext.define('SamosAdmin.atualizacao.aplicacoes.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.aplicacoes',

    onSinteticasClick: async function(){
        const view       = this.getView();
        const moduleName = 'sinteticas';
        const module     = Ext.$(moduleName)[0];
        const tabpanel   = Ext.$('samosviewport')[0].down('tabpanel');
        
        const permissoes = Permissao.services.Model.get({
            groupName: 'Atualização',
            moduleName: 'Aplicações'
        });

        if(!module) {
            const newTab = tabpanel.add({
                xtype: moduleName,
                title: 'Sintéticas',
                permissoes: {
                    lockNovo:    permissoes.create  === false || permissoes.create  === 'F',
                    lockAlterar: permissoes.update  === false || permissoes.update  === 'F',
                    lockExcluir: permissoes.destroy === false || permissoes.destroy === 'F'
                }
            });

            tabpanel.setActiveTab(newTab);

            await SamosUtils.Utils.sleep(500);
            newTab.down('toolbar').focus();
        } else {
            tabpanel.setActiveTab(module);
        }
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();
        
        return {
            conteudo: vm.get('valueConteudo'),
            ordem: vm.get('valueOrdem'),
            razao: 0,
            tipo: vm.get('valueTipo')
        }; 
    },

    onSairClick: function(btn, event) {
        const view = this.getView();
        const preserveMask = btn === 'preserveMask';
        
        if(view){
            if(preserveMask){
                setTimeout(() => {
                    try{
                        if(view != undefined){
                            view.destroy();
                        }
                    } catch(e) {
                        console.error(e);
                    }
                }, 200);
            } else {
                view.initGauge();
            
                setTimeout(() => {
                    try{
                        if(view != undefined){
                            view.stopGauge();
                            view.destroy();
                        }
                    } catch(e) {
                        console.error(e);
                        Ext.$('loadmask').map(mask => mask.hide());
                    }
                }, 200);
            }

            //Limpa o valor do campo
            view.lookupReference('contasintetica').setValue('');
        }
    },

    onNovoClick: async function(btn, event) {
        const view = this.getView(),
              vm = this.getViewModel();

        const newModel = Ext.create(view.modelName || this.$className.replace(/\.[a-z]*\.ViewController/, '.Model'));

        //Se o usuario tentar incluir uma conta analitica e não selecionar uma conta sintetica
        if( vm.get('valueRazao') == 0 && !vm.get('valueIdAplicacaoi') ){
            Ext.Note('warning', 'É preciso selecionar uma conta sintética');
            return;
        }
        
        newModel.set(newModel.getIdProperty(), 0);

        SamosUtils.Events.enableWarnReload();
        return await this.createForm(newModel, false, view);
    },

    createForm: async function (record, readOnly, listView) {
        const view = this.getView(),
              vm = this.getViewModel(),
              isNovaAnalitica = vm.get('valueRazao') == 0;

        const moduleName = SamosUtils.Info.getModuleName(this).split('-');
        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
        const newForm = Ext.create({
            xtype: moduleName.length > 1 ? (moduleName[0] + '-form' + moduleName[1]) : 'form' + moduleName[0],
            listName: this.getView().title,
            listView: listView,
            permissoes: this.getView().getPermissoes(),
            model: record
        });

        const formController = newForm.getController();

        tabpanel.add(newForm);

        const initialValues = {};

        Object.keys(record.data).forEach(key => {
            const value = record.get(key);

            if(value instanceof Array) {
                initialValues[key] = new Array(value.length).fill().map((item, index) => {
                    return Object.assign({}, value[index]);
                });
            } else {
                initialValues[key] = value;
            }
        });

        newForm.getViewModel().set({
            'readOnly':       !!readOnly,
            'initialValues':  record.isNew() ? {} : initialValues,
            'previousModel':  undefined,
            'editionClosed':  !newForm.down('button[text="Fechar"]'),
            'model':          record,
            'listName':       this.getView().title,
            'forcePesoBruto': new Date()
        });

        tabpanel.setActiveTab(newForm);
        tabpanel.disableOtherTabs();

        if(!readOnly){ formController.doDefaultFocus(); }

        newForm.applyTextSearches();

        //Se tiver o callback personalizado onAposCriarForm
        if( formController['onAposCriarForm'] && typeof formController['onAposCriarForm'] == 'function' ){
            formController['onAposCriarForm'].bind(formController)( newForm, record.isNew() );
        }

        return newForm;
    },

    onImprimirClick: async function() {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const vm = this.getViewModel();        

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/aplicacoes`,
                    method: 'GET',
                    query: {
                        empresa    : vm.get('valueIdEmpresa'),            
                        empresacnpj: configs.getEmpresa().cnpj,
                        conteudo   : vm.get('valueConteudo'),
                        ordem      : 3,
                        razao      : vm.get('valueRazao'),
                        tipo       : vm.get('valueTipo'),
                        start      : 0,
                        limit      : 99999,
                        trazerTodos: 'T'
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();       
    }
});
