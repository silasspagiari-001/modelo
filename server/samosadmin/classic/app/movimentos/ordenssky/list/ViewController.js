Ext.define('SamosAdmin.movimentos.ordenssky.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.ordenssky',

    init: function(view) {
        setTimeout(() => {
            this.carregarTecnicosEmMemoria(view);
        }, 100);
    },

    carregarTecnicosEmMemoria: function(view) {
        view.initGauge();
    
        SamosUtils.Request.nodeApi({
            url: `/usuarios`,
            method: 'GET',
            query: {
                tipo: '2'
            }
        })
        .done(res => configs.getOrdens().tecnicos = res.results)
        .fail(err => console.error(err))
        .always(() => view.stopGauge());
    },

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getView().title;
            await Ordem.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar novo documento');
        }
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            empresa: configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            numero : vm.get('valueNumero'),
            pessoa : vm.get('valueIdPessoa'),
            tecnico: configs.getUsuario().tipo == '2' ? configs.getUsuario().id : '',
            inicio : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final  : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem  : vm.get('valueOrdem'),
            status : vm.get('valueStatus')
        };
    },

    onItemDblClick: async function(grid, record) {
        const empresaSelecionada = record.get('ORDENS_ID_EMPRESAS');
        const nomeEmpresaSelecionada = record.get('EMPRESAS_FANTASIA');
        const title = this.getView().title;
        
        if(empresaSelecionada != configs.getEmpresa().id){
            Ext.Msg.confirm('Confirmação', `Você selecionou um movimento da empresa<br>${nomeEmpresaSelecionada} e será redirecionado para ela<br><b>Deseja continuar?</b>`, async confirm => {
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
                            const movimentoCompleto = await Ordem.services.Model.get(record.get('ORDENS_ID'));

                            if(movimentoCompleto) {
                                comboEmpresa.suspendEvents();
                                comboEmpresa.setValue(empresaSelecionada);
                                Ext.defer(comboEmpresa.resumeEvents, 50, comboEmpresa);
    
                                this.getView().setPermissoes({
                                    lockNovo:    module.create  === false || module.create  === 'F',
                                    lockAlterar: module.update  === false || module.update  === 'F',
                                    lockExcluir: module.destroy === false || module.destroy === 'F'
                                });

                                Ext.$('samosviewport')[0].getController().updateEmpresa(empresaSelecionada, configs.getEmpresa().id, permissao);
                            }
                        }
                    } else {
                        Ext.Note('warning', 'Você não possui permissões nesta empresa');
                    }
                }
            });
        } else {
            this.getView().initGauge();
            const movimentoCompleto = await Ordem.services.Model.get(record.get('ORDENS_ID'));
            
            if(movimentoCompleto) {
                await this.createForm(movimentoCompleto[0], true, this.getView());
            }
        }
        
        this.getView().stopGauge();
    },

    onRecebidasClick: function() {
        const view = Ext.create({
            xtype: 'ordensskyrecebidas'
        });

        view.focus(true);

        this.getView().add(view);
    },

    onSincronizarOSClick: function() {
        const view = Ext.create({
            xtype: 'ordensskylistsincronizaros'
        });

        view.getViewModel().set('numerosOS', this.getViewModel().get('valueNumero'));

        view.focus(true);

        this.getView().add(view);
    },

    onRotasClick: function() {
        const view = Ext.create({
            xtype: 'ordensskyrotas'
        });

        view.focus(true);

        this.getView().add(view);
    },

    onAvancoClick: function() {
        const view = Ext.create({
            xtype: 'ordensskyavanco'
        });

        view.focus(true);

        this.getView().add(view);
    }
});
