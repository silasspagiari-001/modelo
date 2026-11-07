Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.romaneiosconstrucao',

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;

        return {
            empresa      : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            documento    : '',
            nomedocumento: title,
            numero       : vm.get('valueNumero'),
            pessoa       : vm.get('valueIdPessoa'),
            inicio       : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final        : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem        : vm.get('valueOrdem'),
            status       : vm.get('valueStatus')
        };
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getView().title.split(' ')[0] + ' Entrega';
            await Romaneioconstrucao.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },
    
    onPendenciasClick: function (component, objItem, e) {
        const module = Ext.$('pendenciasromaneioconstrucao')[0];
    
       if(!module) {
           const tabpanel = Ext.$('tabpanel#contentPanel')[0];
           const newTab = tabpanel.add({
               xtype: 'pendenciasromaneioconstrucao',
               title: 'Pendências Romaneio'
           });
    
           tabpanel.setActiveTab(newTab);
       } else {
           const tabpanel = this.getView().down('tabpanel');
           tabpanel.setActiveTab(module);
       }
    },

    onItemDblClick: async function(grid, record) {
        const empresaSelecionada = record.get('ROMANEIOS_ID_EMPRESAS');
        const nomeEmpresaSelecionada = record.get('EMPRESAS_FANTASIA');
        const title = this.getView().title;
        
        if(empresaSelecionada != configs.getEmpresa().id){
            Ext.Msg.confirm('Confirmação', `Você selecionou um romaneio da empresa<br>${nomeEmpresaSelecionada} e será redirecionado para ela<br><b>Deseja continuar?</b>`, async confirm => {
                if (confirm == 'yes') {
                    const permissoes = Ext.$('combo[reference="comboempresa"]')[0].getStore().getData().items.filter(permissao => {
                        return permissao.get('PERMISSOES_ID_EMPRESAS') == empresaSelecionada;
                    });

                    if(permissoes.length) {
                        const permissao = Permissao.services.Model.get({ empresa: empresaSelecionada });
                        const module = Permissao.services.Model.get({
                            groupName: 'Movimentos',
                            moduleName: title,
                            empresa: empresaSelecionada 
                        });
                        const podeVisualizar = module ? module.read : false;
                        const comboEmpresa = Ext.$('combobox[reference="comboempresa"]')[0];

                        if(!podeVisualizar) {
                            Ext.Note('warning', `Você não tem permissão para visualizar ${title} desta empresa`);
                        } else {
                            this.getView().initGauge();
                            const romaneioconstrucaoCompleto = await Romaneioconstrucao.services.Model.get(record.get('ROMANEIOS_ID'));

                            if(romaneioconstrucaoCompleto) {
                                comboEmpresa.suspendEvents();
                                comboEmpresa.setValue(empresaSelecionada);
                                Ext.defer(comboEmpresa.resumeEvents, 50, comboEmpresa);
    
                                this.getView().setPermissoes({
                                    lockNovo:    !module.create,
                                    lockAlterar: !module.update,
                                    lockExcluir: !module.destroy
                                });
    
                                Ext.$('samosviewport')[0].getController().updateEmpresa(empresaSelecionada, configs.getEmpresa().id, permissao);
                                await this.createForm(romaneioconstrucaoCompleto[0], true, this.getView());
                            }
                        }

                    } else {
                        Ext.Note('warning', 'Você não possui permissões nesta empresa');
                    }
                }
            });
        } else {
            this.getView().initGauge();
            const romaneioconstrucaoCompleto = await Romaneioconstrucao.services.Model.get(record.get('ROMANEIOS_ID'));
            
            if(romaneioconstrucaoCompleto) {
                await this.createForm(romaneioconstrucaoCompleto[0], true, this.getView());
            }
        }
        
        this.getView().stopGauge();
    }
    
});