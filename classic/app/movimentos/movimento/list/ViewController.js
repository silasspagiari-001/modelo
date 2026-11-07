Ext.define('SamosAdmin.movimentos.movimento.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.movimentos',

    onNovoClick: async function () {

        const pessoaOrigem = this.getViewModel().get('pessoaOrigem');

        const view = this.getView();
//        const isUDM = SamosUtils.String.isUltimoDiaUtilDoMes() || false;
//        console.log('isUDM: ', isUDM);

        try {
            const nomeDocumento = view.title;
            let proximaNfe = 0;

            if(configs.getClientName() == 'prudenmoveis' && !configs.getUsuario().privilegiado) { // Na pruden checa sempre se o caixa está aberto, em qualquer movimento
                view.initGauge('Verificando caixa diário...');
        
                const data = momentServer().format('YYYY-MM-DD');
                const statusCaixa = await Caixa.services.Model.getStatus(data);
        
                view.stopGauge(true);
        
                if(statusCaixa == 'F') {
                    Ext.Note('warning', 'O caixa diário está fechado!');
                    return;
                } else if(!statusCaixa) {
                    Ext.Note('warning', 'O caixa diário não foi aberto!');                    
                    return;
                }
            }

            if(nomeDocumento.match(/Pedidos/i) && configs.getClientName() == 'prudenaco') {
                Ext.Note('warning', 'Inclusão de pedidos não permitida - Inclua via orçamento');
                return;
            }
            
            if(nomeDocumento.match(/Nota Eletrônica|Pedidos|Orçamentos/i) &&
               configs.getClientName() != 'prudenaco' &&
               configs.getClientName() != 'racaforte') {
                view.initGauge();

                const nfPendentes = await Movimento.services.Documento.verificarNFPendentes({ 
                    meses     : 1,
                    incluiHoje: 'F'
                });
    
                if(nfPendentes) {
                    view.stopGauge();
                    SamosUtils.Msg.alert('Lembrete', `Há notas a serem enviadas!<br><h5>${nfPendentes}</h5>Altere a emissão da NF para a data de hoje`, 4000);
                    return; 
                }

                //Verifica se tem pedidos com caixa divergentes
                const pedDivergentes = await Movimento.services.Documento.verificarPedDivergentes({ 
                    meses     : 1,
                    incluiHoje: 'F'
                });
    
                if(pedDivergentes) {
                    view.stopGauge();
                    SamosUtils.Msg.alert('Lembrete', `Há pedidos com caixa divergente!<br><h5>${pedDivergentes}<h5>`, 4000);
                    return; 
                }

                if(nomeDocumento.match(/Nota Eletrônica/i) && configs.getEmpresa().ambiente != 'H') {

                    let nfForaSequencia = '';

                    if(configs.getClientName() == 'prudenmoveis' && 
                       (configs.getEmpresa().id == 2 || configs.getEmpresa().id == 9)) {
                        // FT e RB compartilham sequencia, então não faz essa checagem
                    } else {
                        nfForaSequencia = await Movimento.services.Documento.verificarSequenciaNF();
                    }
                    
                    if(nfForaSequencia) {
                        view.stopGauge();
                        SamosUtils.Msg.alert('Atenção', `Há notas fora da sequência!<br><h5>${nfForaSequencia}</h5>`, 4000);
                        return; 
                    }

                    proximaNfe = await Movimento.services.Documento.getProximaNFe();                    

                    if(proximaNfe != this.getViewModel().get('modelNumero') &&
                       proximaNfe > 0) {  // Atualiza numero da nota
                        this.getViewModel().set({
                            'modelNumero' : proximaNfe
                        });    
                    }

                }
            }

/*            if(nomeDocumento.match(/Nota Eletrônica/) && isUDM) { // Checa pra todos sem exceção no UDM
                view.initGauge();

                const nfPendentes = await Movimento.services.Documento.verificarNFPendentes({ 
                    meses     : 1,
                    incluiHoje: 'T'
                });
    
                if(nfPendentes) {
                    view.stopGauge();
                    SamosUtils.Msg.alert('Lembrete', `Há notas a serem enviadas antes!<br><h5>${nfPendentes}</h5>Envie elas primeiro ou contate o suporte`, 4000);
                    return; 
                }                
            }*/

            if(nomeDocumento.match(/Transferências/i) && configs.getEmpresa().id != 1) {
                view.initGauge();

                const transferPendentes = await Movimento.services.Documento.verificarTransfPendentes({ 
                    meses     : 1,
                    incluiHoje: 'T'
                });
    
                if(transferPendentes) {
                    view.stopGauge();
                    SamosUtils.Msg.alert('Lembrete', `Há Transferências pendentes!<br><h5>${transferPendentes}</h5>Altere a transferência em aberto`, 4000);
                    return; 
                }
            }

            const form = await this.callParent(arguments);

            if(nomeDocumento.match(/Nota Eletrônica/i)) {
                await Movimento.services.Model.definirValoresPadrao(form, nomeDocumento, proximaNfe);
            } else {
                await Movimento.services.Model.definirValoresPadrao(form, nomeDocumento);
                if(configs.getClientName() == 'stilomoveis') {
                    if(pessoaOrigem) { // Se vier de chamada do cadastro de pessoas
                        form.model.set({
                            'MOVIMENTOS_ID_PESSOAS': pessoaOrigem.get('PESSOAS_ID'),
                            'MOVIMENTOS_CPFCNPJ'   : pessoaOrigem.get('PESSOAS_CPFCNPJ'),
                            'MOVIMENTOS_CELULAR'   : pessoaOrigem.get('PESSOAS_CELULAR'),
                            'MOVIMENTOS_EMAIL'     : pessoaOrigem.get('PESSOAS_EMAIL'),
                            'MOVIMENTOS_NOME'      : pessoaOrigem.get('PESSOAS_NOME'),
                            'PESSOAS_NOME'         : pessoaOrigem.get('PESSOAS_NOME'),
                            'PESSOAS_CPFCNPJ'      : pessoaOrigem.get('PESSOAS_CPFCNPJ'),
                            'PESSOAS_ENDERECO'     : pessoaOrigem.get('PESSOAS_ENDERECO'),
                            'PESSOAS_CELULAR'      : pessoaOrigem.get('PESSOAS_CELULAR'),
                            'CIDADES_NOME'         : pessoaOrigem.get('CIDADES_NOME'),
                            'CIDADES_ESTADO'       : pessoaOrigem.get('CIDADES_ESTADO')
                        });        
                    }
                }
            }

            if(
                configs.getMovimentos().ramoRomaneio == 'moveis' &&
                nomeDocumento == 'Pedidos'
            ){
                const btnOpcoes = view.down('button[text="Opções"]');
                const btnCaixa  = view.down('button[text="Caixa"]');
                
                if(btnOpcoes) {
                    btnOpcoes.getEl().dom.style.backgroundColor = 'yellow';
                    btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                }

                if(btnCaixa) {
                    btnCaixa.getEl().dom.style.backgroundColor = 'yellow';
                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                }
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível incluir um novo movimento');
        }

        view.stopGauge();

        if(pessoaOrigem) {
            this.getViewModel().set('pessoaOrigem' , '');
            const formMovimento = Ext.$('formmovimentos')[0];
            const gridItems = formMovimento.lookup('produtos');
            Ext.defer(gridItems.focarNovoItem, 200, gridItems);
        } else {
            this.lookup('pessoa').focus(true);
        }

        return view;
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const title = this.getView().title;

        return {
            numero        : vm.get('valueNumero'),
            empresa       : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
            pessoa        : vm.get('valueIdPessoa'),
            documento     : '', //trazer pelo nome
            nomedocumento : title == 'Transferências' ? 'Transferências Saída' : title,
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
            const nomeEmpresaSelecionada = record.get('EMPRESAS_FANTASIA');
            const title = view.title;
            const isTransferencia = title.match(/Transfer/);
            
            if(empresaSelecionada != configs.getEmpresa().id && !isTransferencia){
                if(await SamosUtils.Msg.confirm(`Você selecionou um movimento da empresa<br>${nomeEmpresaSelecionada} e será redirecionado para ela<br><b>Deseja continuar?</b>`)) {
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
                    const movimentoCompleto = await Movimento.services.Model.get(record.get('MOVIMENTOS_ID'));

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

                const movimentoCompleto = await Movimento.services.Model.get(record.get('MOVIMENTOS_ID'));
                
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

    getNumeroRomaneios: function(movimentoCompleto) {
        const romaneios = movimentoCompleto[0].get('ROMANEIOS_MOVEIS') || [];
        const romaneioEntrega  = romaneios.filter(romaneio => {
                return romaneio['DOCUMENTOS_NOME'].match(/Entrega/);
            }).reduce((numero, romaneio) => {
                return romaneio['ROMANEIOS_NUMERO'];
            }, '');
        const romaneioMontagem  = romaneios.filter(romaneio => {
                return romaneio['DOCUMENTOS_NOME'].match(/Montagem/);
            }).reduce((numero, romaneio) => {
                return romaneio['ROMANEIOS_NUMERO'];
            }, '');
        
        (movimentoCompleto[0].get('MOVIMENTOS_ITENS') || []).forEach(item => {
            item['ROMANEIOSENTREGA_NUMERO']  = romaneioEntrega;
            item['ROMANEIOSMONTAGEM_NUMERO'] = romaneioMontagem;
        });
    },

    getNomeRomaneios: function(movimentoCompleto) {
        const romaneios = movimentoCompleto[0].get('ROMANEIOS_MOVEIS') || [];
        const romaneioEntrega  = romaneios.filter(romaneio => {
                return romaneio['DOCUMENTOS_NOME'].match(/Entrega/);
            }).reduce((numero, romaneio) => {
                return romaneio['PESSOAS_FANTASIA'];
            }, '');
        const romaneioMontagem  = romaneios.filter(romaneio => {
                return romaneio['DOCUMENTOS_NOME'].match(/Montagem/);
            }).reduce((numero, romaneio) => {
                return romaneio['PESSOAS_FANTASIA'];
            }, '');
        
        (movimentoCompleto[0].get('MOVIMENTOS_ITENS') || []).forEach(item => {
            item['ROMANEIOSENTREGA_NOME']  = romaneioEntrega;
            item['ROMANEIOSMONTAGEM_NOME'] = romaneioMontagem;
        });
    },

    customizarOpcoes: async function(form, movimentoCompleto) {
        this.getNumeroRomaneios(movimentoCompleto);
        this.getNomeRomaneios(movimentoCompleto);
                                        
        if(
            movimentoCompleto[0].get('MOVIMENTOS_STATUS') != 'C' &&
            configs.getMovimentos().ramoRomaneio == 'moveis'    &&
            form.title == 'Pedido'
        ){
            if(movimentoCompleto[0].get('RESERVAS_STATUS') != 'T') {
                const btnOpcoes = form.down('button[text="Opções"]');
                if(btnOpcoes) {
                    btnOpcoes.getEl().dom.style.backgroundColor = 'yellow';
                    btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                }
            }
            if(movimentoCompleto[0].get('MOVIMENTOS_STATUS') != 'F') {
                const btnCaixa  = form.down('button[text="Caixa"]');
                if(btnCaixa) {
                    btnCaixa.getEl().dom.style.backgroundColor = 'yellow';
                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                }
            }
        }

        const btnBaixar = form.down('button[text="Baixar"]');
        if(btnBaixar) {
            btnBaixar.getEl().dom.style.backgroundColor = 'green';
        }


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
    },

    onBoletosPagosClick: async function() {
        const view = this.getView();

        try {
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/boletospagos`,
                method: 'GET'
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    }
});
