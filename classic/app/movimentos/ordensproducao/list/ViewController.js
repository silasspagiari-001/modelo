Ext.define('SamosAdmin.movimentos.ordensproducao.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.ordensproducao',

    onNovoClick: async function () {
        const form = await this.callParent(arguments);

        try {
            const idEmpresa     = configs.getEmpresa().id;
            const nomeDocumento = this.getView().title;
            const model         = form.model;
            const documento     = await Documento.services.Model.get(nomeDocumento, idEmpresa);
    
            model.set({
                'PRODUCOES_ID_DOCUMENTOS' : documento.get('DOCUMENTOS_ID'),
                'PRODUCOES_ID_PESSOAS'    : documento.get('DOCUMENTOS_ID_PESSOAS'),
                'PESSOAS_NOME'            : documento.get('PESSOAS_NOME'),
                'PESSOAS_ENDERECO'        : documento.get('PESSOAS_ENDERECO'),
                'CIDADES_NOME'            : documento.get('CIDADES_NOME'),
                'CIDADES_ESTADO'          : documento.get('CIDADES_ESTADO'),
                'PRODUCOES_ID_OPERACOES_S': documento.get('DOCUMENTOS_ID_OPERACOES'),
                'PRODUCOES_ID_OPERACOES_E': documento.get('DOCUMENTOS_LAYOUT'),
                'OPERACOESENTRADA_NOME'   : documento.get('OPERACOES_NOME')
            });

            form.lookup('pessoa').setSearchedId(documento.get('PESSOAS_NOME'));
            
        } catch (error) {
            form.destroy();
            SamosUtils.Msg.error(error, 'Erro ao criar novo documento');
        }

        return form;
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const ordem = vm.get('valueOrdem');

        return {
            empresa : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            numero  : vm.get('valueNumero'),
            produto : ordem != 4 && ordem != 5 ? vm.get('valueIdProduto') : '',
            lote    : ordem == 4 ? vm.get('valueIdLote')   : '',
            pessoa  : ordem == 5 ? vm.get('valueIdPessoa') : '',
            inicio  : momentTz(this.lookup('inicio').getValue()).format('YYYY-MM-DD'),
            final   : momentTz(this.lookup('final').getValue()).format('YYYY-MM-DD'),
            ordem   : ordem,
            status  : vm.get('valueStatus')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            const empresaSelecionada     = record.get('PRODUCOES_ID_EMPRESAS');
            const nomeEmpresaSelecionada = record.get('EMPRESAS_FANTASIA');
            
            if(empresaSelecionada != configs.getEmpresa().id){
                if(await SamosUtils.Msg.confirm(`Você selecionou uma ordem de produção da empresa<br>${nomeEmpresaSelecionada} e será redirecionado para ela<br><b>Deseja continuar?</b>`)) {
                    const permissoes = Ext.$('combo[reference="comboempresa"]')[0].getStore().getData().items.filter(permissao => {
                        return permissao.get('PERMISSOES_ID_EMPRESAS') == empresaSelecionada;
                    });
        
                    if(permissoes.length == 0) {
                        throw 'Você não possui permissões nesta empresa';
                    }
    
                    const permissao = Permissao.services.Model.get({ empresa: empresaSelecionada });
                    
                    const module = Permissao.services.Model.get({
                        groupName: 'Movimentos',
                        moduleName: view.title,
                        empresa: empresaSelecionada 
                    });
                    
                    const podeVisualizar = module ? module.read : false;
                    const comboEmpresa = Ext.$('combobox[reference="comboempresa"]')[0];
    
                    if(!podeVisualizar) {
                        throw `Você não tem permissão para visualizar ${view.title} desta empresa`;
                    }
                    
                    view.initGauge();
    
                    const queryModelCompleto = await SamosUtils.Request.nodeApi({
                        url: `/ordensproducao/${record.get('PRODUCOES_ID')}`,
                        method: 'GET'
                    });
    
                    record.set(queryModelCompleto.results[0]);
    
                    comboEmpresa.suspendEvents();
                    comboEmpresa.setValue(empresaSelecionada);
                    Ext.defer(comboEmpresa.resumeEvents, 50, comboEmpresa);
    
                    view.setPermissoes({
                        lockNovo:    module.create  === false || module.create  === 'F',
                        lockAlterar: module.update  === false || module.update  === 'F',
                        lockExcluir: module.destroy === false || module.destroy === 'F'
                    });
    
                    Ext.$('samosviewport')[0].getController().updateEmpresa(empresaSelecionada, configs.getEmpresa().id, permissao);
                    await this.createForm(record, true, view);
                }
            } else {
                view.initGauge();
    
                const queryModelCompleto = await SamosUtils.Request.nodeApi({
                    url: `/ordensproducao/${record.get('PRODUCOES_ID')}`,
                    method: 'GET'
                });
    
                record.set(queryModelCompleto.results[0]);
                
                await this.createForm(record, true, view);
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar ordem de produção');
        }

        view.stopGauge();
    },

    onLotesClick: async function(btn, e) {
        const view       = this.getView();
        const moduleName = 'lotes';
        const module     = Ext.$(moduleName)[0];
        const tabpanel   = Ext.$('samosviewport')[0].down('tabpanel');
        
        if(!module) {
            const newTab = tabpanel.add({
                xtype: moduleName,
                title: 'Lotes',
                permissoes: {
                    lockNovo:    view.lockNovo,
                    lockAlterar: view.lockAlterar,
                    lockExcluir: view.lockExcluir,
                }
            });

            tabpanel.setActiveTab(newTab);

            await SamosUtils.Utils.sleep(500);
            newTab.down('toolbar').focus();
        } else {
            tabpanel.setActiveTab(module);
        }
    },
    
    onFormulasClick: async function(btn, e) {
        const view       = this.getView();
        const moduleName = 'ordensproducaoformulas';
        const module     = Ext.$(moduleName)[0];
        const tabpanel   = Ext.$('samosviewport')[0].down('tabpanel');
        
        if(!module) {
            const newTab = tabpanel.add({
                xtype: moduleName,
                title: 'Fórmulas',
                permissoes: {
                    lockNovo:    view.lockNovo,
                    lockAlterar: view.lockAlterar,
                    lockExcluir: view.lockExcluir,
                }
            });

            tabpanel.setActiveTab(newTab);

            await SamosUtils.Utils.sleep(500);
            newTab.down('toolbar').focus();
        } else {
            tabpanel.setActiveTab(module);
        }
    },

    onOrdemChange: function(txt, newValue, oldValue) {
        if(newValue == 4) {
            this.lookup('lote').show();
            this.lookup('produto').hide();
            this.lookup('pessoa').hide();

        } else if(newValue == 5) {
            this.lookup('lote').hide();
            this.lookup('produto').hide();
            this.lookup('pessoa').show();

        } else {
            this.lookup('lote').hide();
            this.lookup('produto').show();
            this.lookup('pessoa').hide();
        }

        this.lookup('searchtoolbar').focus(true);
    }
});
