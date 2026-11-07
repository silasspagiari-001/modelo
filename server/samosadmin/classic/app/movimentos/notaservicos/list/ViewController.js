Ext.define('SamosAdmin.movimentos.notaservicos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.notaservicos',

    onNovoClick: async function () {
        const view = this.getView();

        try {
            const nomeDocumento = 'Nota Serviço';
            const form = await this.callParent(arguments);
            await NotaServicos.services.Model.definirValoresPadrao(form, nomeDocumento);
            
            view.initGauge(); 

            let nsForaSequencia = '';

            nsForaSequencia = await NotaServicos.services.Documento.verificarSequenciaNS();
                
            if(nsForaSequencia) {
                view.stopGauge();
                SamosUtils.Msg.alert('Atenção', `Há notas de serviço fora da sequência!<br><h5>${nsForaSequencia}</h5>`, 4000);
                return; 
            }

            proximaNfs = await NotaServicos.services.Documento.getProximaNFse();

            if(proximaNfs != form.getViewModel().get('modelNumero') &&
                proximaNfs > 0) {
                form.getViewModel().set({
                    'modelNumero' : (proximaNfs + 1)
                });    
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível incluir uma nova Nota');
        }

        view.stopGauge();
        this.lookup('pessoa').focus(true);

        return view;
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = 'Nota Serviço';

        return {
            numero          : vm.get('valueNumero'),
            empresa         : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            pessoa          : vm.get('valueIdPessoa'),
            documento       : '', //trazer pelo nome
            nomedocumento   : title,
            filtravendedor  : (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
            notaservicosnome: vm.get('valuePessoa'),
            inicio          : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final           : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            tipo            : vm.get('valueTipo'),            
            ordem           : vm.get('valueOrdem'),
            status          : vm.get('valueStatus')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            const empresaSelecionada = record.get('ORDENS_ID_EMPRESAS');
            const title = 'Nota Serviço';
            
            if(empresaSelecionada != configs.getEmpresa().id){
                if(await SamosUtils.Msg.confirm(`Você selecionou uma Nota de Serviço da empresa<br>${record.get('ORDENS_ID_EMPRESAS')} e será redirecionado para ela<br><b>Deseja continuar?</b>`)) {
                    const permissoes = Ext.$('combo[reference="comboempresa"]')[0].getStore().getData().items.filter(permissao => {
                        return permissao.get('PERMISSOES_ID_EMPRESAS') == empresaSelecionada;
                    });

                    if(permissoes.length == 0) {
                        throw 'Você não possui permissões nesta empresa';
                    }
        
                    const permissao = Permissao.services.Model.get({ empresa: empresaSelecionada });
                    const module = Permissao.services.Model.get({
                        groupName: 'Movimentos',
                        moduleName: title,
                        empresa: empresaSelecionada 
                    });

                    const podeVisualizar = module ? module.read : false;
                    const comboEmpresa = Ext.$('combobox[reference="comboempresa"]')[0];
    
                    if(!podeVisualizar) {
                        throw `Você não tem permissão para visualizar ${title} desta empresa`;
                    }
                    
                    view.initGauge();
                    const notaservicosCompleta = await NotaServicos.services.Model.get(record.get('ORDENS_ID'));

                    if(notaservicosCompleta) {
                        comboEmpresa.suspendEvents();
                        comboEmpresa.setValue(empresaSelecionada);
                        Ext.defer(comboEmpresa.resumeEvents, 50, comboEmpresa);

                        view.setPermissoes({
                            lockNovo:    module.create  === false || module.create  === 'F',
                            lockAlterar: module.update  === false || module.update  === 'F',
                            lockExcluir: module.destroy === false || module.destroy === 'F'
                        });

                        Ext.$('samosviewport')[0].getController().updateEmpresa(empresaSelecionada, configs.getEmpresa().id, permissao);
                        
                        const form = await this.createForm(notaservicosCompleta[0], true, view);
                        await this.customizarOpcoes(form, notaservicosCompleta);
                    }
                }
            } else {
                view.initGauge();

                const notaservicosCompleta = await NotaServicos.services.Model.get(record.get('ORDENS_ID'));
                
                if(notaservicosCompleta) {
                    const form = await this.createForm(notaservicosCompleta[0], true, view);
                    await this.customizarOpcoes(form, notaservicosCompleta);
                }
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar Nota de Serviço');
        }
        
        view.stopGauge();
    },

    customizarOpcoes: async function(form) {
        await SamosUtils.Utils.sleep(1000);

        const griditens = form.down('samoswidgets-griditems');
        const forms = griditens.query('form')
        
        forms.forEach(form => {
            form.query('field').forEach(field => {
                field.setUi('gridtext-' + configs.getTema());
            });
        });
    }
});
