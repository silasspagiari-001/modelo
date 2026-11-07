Ext.define('SamosAdmin.movimentos.notaconsumidor.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.notaconsumidor',

    onNovoClick: async function () {
        const view = this.getView();

        try {

            view.initGauge('Verificando NFC-e Pendentes de envio...');

            const nfcPendentes = await NotaConsumidor.services.Documento.verificarNFCPendentes({ 
                meses     : 1,
                incluiHoje: 'F'
            });

            if(nfcPendentes) {
                SamosUtils.Msg.alert('Lembrete', `Há NFC-es a serem enviadas!<br><h5>${nfcPendentes}</h5>`, 4000);
            }

            view.stopGauge();

            const nomeDocumento = 'Nota Consumidor';
            const form = await this.callParent(arguments);
            await NotaConsumidor.services.Model.definirValoresPadrao(form, nomeDocumento);
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível incluir um novo movimento');
        }        

        view.stopGauge();
        this.lookup('pessoa').focus(true);

        return view;
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = 'Nota Consumidor';

        return {
            numero        : vm.get('valueNumero'),
            empresa       : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            pessoa        : vm.get('valueIdPessoa'),
            documento     : '', //trazer pelo nome
            nomedocumento : title,
            filtravendedor: (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
            movimentosnome: vm.get('valuePessoa'),
            inicio        : momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final         : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            tipo          : vm.get('valueTipo'),            
            ordem         : vm.get('valueOrdem'),
            status        : vm.get('valueStatus')
        };
    },

    onItemDblClick: async function(grid, record) {
        const view = this.getView();

        try {
            const empresaSelecionada = record.get('MOVIMENTOS_ID_EMPRESAS');
            const title = 'Nota Consumidor';
            
            if(empresaSelecionada != configs.getEmpresa().id){
                if(await SamosUtils.Msg.confirm(`Você selecionou um movimento da empresa<br>${record.get('MOVIMENTOS_ID_EMPRESAS')} e será redirecionado para ela<br><b>Deseja continuar?</b>`)) {
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
                    const movimentoCompleto = await NotaConsumidor.services.Model.get(record.get('MOVIMENTOS_ID'));

                    if(movimentoCompleto) {
                        comboEmpresa.suspendEvents();
                        comboEmpresa.setValue(empresaSelecionada);
                        Ext.defer(comboEmpresa.resumeEvents, 50, comboEmpresa);

                        view.setPermissoes({
                            lockNovo:    module.create  === false || module.create  === 'F',
                            lockAlterar: module.update  === false || module.update  === 'F',
                            lockExcluir: module.destroy === false || module.destroy === 'F'
                        });

                        Ext.$('samosviewport')[0].getController().updateEmpresa(empresaSelecionada, configs.getEmpresa().id, permissao);
                        
                        const form = await this.createForm(movimentoCompleto[0], true, view);
                        await this.customizarOpcoes(form, movimentoCompleto);
                    }
                }
            } else {
                view.initGauge();

                const movimentoCompleto = await NotaConsumidor.services.Model.get(record.get('MOVIMENTOS_ID'));
                
                if(movimentoCompleto) {
                    const form = await this.createForm(movimentoCompleto[0], true, view);
                    await this.customizarOpcoes(form, movimentoCompleto);
                }
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao carregar movimento');
        }
        
        view.stopGauge();
    },

    customizarOpcoes: async function(form) {
        await SamosUtils.Utils.sleep(1000);

        const griditens = form.down('samoswidgets-griditems');
        const forms = griditens.query('form')
        
        forms.forEach(form => {
            const values = form.getValues();

            if(values['VALOR_PROMOCAO'] > 0 ||
               (configs.getClientName() == 'racaforte' && values['PRODUTOS_DERIVADO'] == 'V')) {
                form.query('field').forEach(field => {
                    field.setUi('gridtextblue');
                });
            } else {
                form.query('field').forEach(field => {
                    field.setUi('gridtext-' + configs.getTema());
                });
            }
        });
    }
});
