Ext.define('SamosAdmin.movimentos.ordensmoveis.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.ordensmoveis',

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getView().title;

            if(configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) { // Na pruden checa sempre se o caixa está aberto, em qualquer movimento
                this.getView().initGauge('Verificando caixa diário...');
        
                const data = momentServer().format('YYYY-MM-DD');
                const statusCaixa = await Caixa.services.Model.getStatus(data);
        
                this.getView().stopGauge(true);
        
                if(statusCaixa == 'F') {
                    Ext.Note('warning', 'O caixa diário está fechado!');
                    return;
                } else if(!statusCaixa) {
                    Ext.Note('warning', 'O caixa diário não foi aberto!');                    
                    return;
                }
            }

            await Ordemmoveis.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            empresa : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            numero  : vm.get('valueNumero'),
            pessoa  : vm.get('valueIdPessoa'),
            montador: configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor ? configs.getUsuario().id : '',
            inicio  : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final   : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem   : vm.get('valueOrdem'),
            status  : vm.get('valueStatus')
        };
    },

    onItemDblClick: async function(grid, record) {
        const empresaSelecionada = record.get('ORDENS_ID_EMPRESAS');
        const nomeEmpresaSelecionada = record.get('EMPRESAS_FANTASIA');
        const title = this.getView().title;
        
        if(empresaSelecionada != configs.getEmpresa().id){
            Ext.Msg.confirm('Confirmação', `Você selecionou uma ordem de serviço da empresa<br>${nomeEmpresaSelecionada} e será redirecionado para ela<br><b>Deseja continuar?</b>`, async confirm => {
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
                            const ordemmoveisCompleto = await Ordemmoveis.services.Model.get(record.get('ORDENS_ID'));

                            if(ordemmoveisCompleto) {
                                comboEmpresa.suspendEvents();
                                comboEmpresa.setValue(empresaSelecionada);
                                Ext.defer(comboEmpresa.resumeEvents, 50, comboEmpresa);
    
                                this.getView().setPermissoes({
                                    lockNovo:    module.create  === false || module.create  === 'F',
                                    lockAlterar: module.update  === false || module.update  === 'F',
                                    lockExcluir: module.destroy === false || module.destroy === 'F'
                                });
    
                                Ext.$('samosviewport')[0].getController().updateEmpresa(empresaSelecionada, configs.getEmpresa().id, permissao);
                                await this.createForm(ordemmoveisCompleto[0], true, this.getView());
                            }
                        }
                    } else {
                        Ext.Note('warning', 'Você não possui permissões nesta empresa');
                    }
                }
            });
        } else {
            this.getView().initGauge();
            const ordemmoveisCompleto = await Ordemmoveis.services.Model.get(record.get('ORDENS_ID'));
            
            if(ordemmoveisCompleto) {
                await this.createForm(ordemmoveisCompleto[0], true, this.getView());
            }
        }
        
        this.getView().stopGauge();
    },
    
    onExportarClick: function() {
        Ext.Note('warning', 'Em desenvolvimento');
    }
});
