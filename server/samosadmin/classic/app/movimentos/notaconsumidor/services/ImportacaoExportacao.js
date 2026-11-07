Ext.define('SamosAdmin.movimentos.notaconsumidor.services.ImportacaoExportacao', {
    alternateClassName: 'NotaConsumidor.services.ImportacaoExportacao',
    singleton: true,

    /**
     * Exportacao
     */
    paraNotaEletronica: async function(form, list) {
        const nfc       = form.nfcNota ? form.nfcNota : null;
        const movimento = form.model;
        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
        let listNotaEletronica = Ext.$('notaeletronica')[0];
        const notaEletronica = Ext.create('SamosAdmin.movimentos.movimento.Model');
        
        if(!listNotaEletronica) {
            const permissoes = Permissao.services.Model.get({
                groupName: 'Movimentos',
                moduleName: 'Nota Eletrônica'
            });

            listNotaEletronica = tabpanel.add({
                xtype: 'movimentos',
                title: 'Nota Eletronica',
                permissoes: {
                    lockNovo:    permissoes.create  === false || permissoes.create  === 'F',
                    lockAlterar: permissoes.update  === false || permissoes.update  === 'F',
                    lockExcluir: permissoes.destroy === false || permissoes.destroy === 'F'
                }
            });

            //Define a data no view model dele
            listNotaEletronica.getViewModel().set({
                'inicio' : momentTz().format('DD/MM/YYYY'),
                'final'  : momentTz().format('DD/MM/YYYY')
            });

            //Define tambem no getBuscarParams
            listNotaEletronica.getController().getBuscarParams = async function () {
                const vm = this.getViewModel();
                const title = 'Nota Eletronica';
        
                return {
                    numero        : vm.get('valueNumero'),
                    empresa       : configs.getMultiEmpresa() ? '' : configs.getEmpresa().id,
                    pessoa        : vm.get('valueIdPessoa'),
                    documento     : '', //trazer pelo nome
                    nomedocumento : title,
                    filtravendedor: (configs.getMovimentos().filtraVendedor && configs.getUsuario().tipo == configs.getUsuarios().tipoVendedor) ? 'true' : 'false',
                    movimentosnome: vm.get('valuePessoa'),
                    inicio        : listNotaEletronica.getViewModel().get('inicio'),
                    final         : listNotaEletronica.getViewModel().get('final'),
                    tipo          : vm.get('valueTipo'),            
                    ordem         : vm.get('valueOrdem'),
                    status        : vm.get('valueStatus')
                };
            }
        }

        notaEletronica.set(notaEletronica.getIdProperty(), 0);

        notaEletronica.set({
            'MOVIMENTOS_ID'               : movimento.get('MOVIMENTOS_ID'),
            'MOVIMENTOS_ID_PESSOAS'       : movimento.get('MOVIMENTOS_ID_PESSOAS'),
            'MOVIMENTOS_ID_PROPRIEDADES'  : movimento.get('MOVIMENTOS_ID_PROPRIEDADES'),
            'MOVIMENTOS_STATUS'           : 'N',
            'MOVIMENTOS_ID_EMPRESAORIGEM' : movimento.get('MOVIMENTOS_ID_EMPRESAS'),
            'MOVIMENTOS_NUMEROORIGEM'     : movimento.get('MOVIMENTOS_NUMERO'),
            'MOVIMENTOS_SERIEORIGEM'      : movimento.get('MOVIMENTOS_SERIE'),
            'MOVIMENTOS_ENTRADASAIDA'     : momentServer().format('YYYY-MM-DD'),
            'PESSOAS_NOME'                : movimento.get('MOVIMENTOS_NOME'),
            'MOVIMENTOS_NOME'             : movimento.get('MOVIMENTOS_NOME'),
            'PESSOAS_CPFCNPJ'             : movimento.get('MOVIMENTOS_CPFCNPJ'),
            'MOVIMENTOS_CPFCNPJ'          : movimento.get('MOVIMENTOS_CPFCNPJ'),
            'PESSOAS_TELEFONE'            : movimento.get('PESSOAS_TELEFONE'),
            'PESSOAS_CELULAR'             : movimento.get('MOVIMENTOS_CELULAR'),
            'MOVIMENTOS_CELULAR'          : movimento.get('MOVIMENTOS_CELULAR'),
            'PESSOAS_EMAIL'               : movimento.get('PESSOAS_EMAIL'),
            'MOVIMENTOS_EMAIL'            : movimento.get('MOVIMENTOS_EMAIL'),
            'PESSOAS_ENDERECO'            : movimento.get('PESSOAS_ENDERECO'),
            'PESSOAS_NUMERO'              : movimento.get('PESSOAS_NUMERO'),
            'CIDADES_NOME'                : movimento.get('CIDADES_NOME'),
            'CIDADES_ESTADO'              : movimento.get('CIDADES_ESTADO'),
            'CIDADES_IBGE'                : movimento.get('CIDADES_IBGE'),

            'CIDADES_NOMEPROPRIEDADE'     : movimento.get('CIDADES_NOMEPROPRIEDADE'),
            'CIDADES_ESTADOPROPRIEDADE'   : movimento.get('CIDADES_ESTADOPROPRIEDADE'),
            'CIDADES_IBGEPROPRIEDADE'     : movimento.get('CIDADES_IBGEPROPRIEDADE'),
            
            'PESSOAS_FORMULA'             : movimento.get('PESSOAS_FORMULA'),
            'MOVIMENTOS_TOTAL'            : movimento.get('MOVIMENTOS_TOTAL'),
            'MOVIMENTOS_OBSERVACOES'      : 'NFc: ' + movimento.get('MOVIMENTOS_NFE') + '|||||||||',
            'MOVIMENTOS_ITENS'            : movimento.get('MOVIMENTOS_ITENS')
        });

        const formNotaEletronica = Ext.create({
            xtype: 'formmovimentos',
            listName: 'Nota Eletrônica',
            listView: listNotaEletronica,
            permissoes: listNotaEletronica.getPermissoes(),
            model: notaEletronica
        });
        //Depois que gravar o pagamento da nota, fecha o list e o form
        formNotaEletronica.onAposPagamento = async function(form, model){
            
        }
        formNotaEletronica.depoisQueGravouNota = async function(form, model){
            const queryAtualizar = await SamosUtils.Request.nodeApi({
                url: `/processos/executasql`,
                method: 'GET',
                query: {
                    nomeSql: 'vincular_documento_notaeletronica_aposcriar',
                    parametroSql: JSON.stringify({
                        id     : model.get('MOVIMENTOS_ID'), //O ID da nova nota exportada
                        codigo : nfc                         //O NFC do nota consumidor, a ser vinculado
                    })     
                }
            }); 
            
            listNotaEletronica.getController().onBuscarClick();
            
            model.get('MOVIMENTOS_ENVIO')[0]['MOVIMENTOSENVIO_REFERENTE'] = nfc;
        }
        formNotaEletronica.depoisQueEmitiuSefaz = async function(form, model){
            listNotaEletronica.destroy();
            //Fecha o form da nota
            this.onSairClick();
        }
        
        const formNotaEletronicaController = formNotaEletronica.getController();

        tabpanel.add(formNotaEletronica);

        formNotaEletronica.getViewModel().set({
            'readOnly':       false,
            'initialValues':  {},
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          notaEletronica,
            'listName':       'Nota Eletrônica'
        });

        tabpanel.setActiveTab(formNotaEletronica);
        tabpanel.disableOtherTabs();
        formNotaEletronicaController.doDefaultFocus();
        await Movimento.services.Model.definirValoresPadrao(formNotaEletronica, 'Nota Eletrônica');

        //Troca a operação
        let operacaoNota;
        //Se for dentro do estado
        if( movimento.get('CIDADES_ESTADO') == configs.getEmpresa().estado ){
            operacaoNota = 592900;
        } else {
            operacaoNota = 692900;
        }

        formNotaEletronica.model.set({
            'MOVIMENTOS_ID_OPERACOES' : operacaoNota,
        })
    },

    fazerExportacaoPadrao: async function(deps) {
        const form = deps.form;

        const usuarioConfirma = await this.checarSeJaExportadoOuImportado(form.getViewModel().get('model'))
        
        if(usuarioConfirma){
            if(configs.getMovimentos().exportarGravado) {
                return await this.exportarPeloBackend(deps);
            } else {
                return await this.exportarPeloFrontend(deps);
            }
        }
    },

    exportarPeloBackend: async function(deps) {
        const form = deps.form;
        const results = [];

        try {
            const vm = form.getViewModel();
    
            form.initGauge();
    
            const queryExportacao = await SamosUtils.Request.nodeApi({
                url: `/processos/exportamovimento`,
                method: 'POST',
                data: {
                    'aliquotas': configs.getAliquotas() || []
                },
                query: {
                    idOrigem: vm.get('model.MOVIMENTOS_ID'),
                    nomeNovoDocumento: deps.listTitle,
                    portadorEmpresa: configs.getPermissao()['EMPRESAS_ID_PORTADORES'],
                    bloqueiasaldo: configs.getMovimentos().avisarSaldoInsuficiente,
                    pedidoLP: configs.getMovimentos().pedidoLP && 
                              deps.listTitle == 'Nota Eletrônica' &&
                              vm.get('model.MOVIMENTOS_SITUACAO') == 1
                }
            });

            if(
                configs.getMovimentos().avisarSaldoInsuficiente && 
                !isNaN(queryExportacao.results[0]['SALDOS_DISPONIVELTOTAL'])
            ) {
                const idsProdutosComSaldoInsuficiente = queryExportacao.results.map(produto => produto['PRODUTOS_ID']);
                throw `Produtos com saldo insuficiente: ` + idsProdutosComSaldoInsuficiente.join(',');
            }
                        
            if(
                configs.getMovimentos().sistemaDeAprovacao && 
                vm.get('isOrcamento')
            ) {
                await SamosUtils.Utils.sleep(500);
                deps.list.getController().onBuscarClick();
                form.getController().onSairClick();

            } else {
                const novo = Ext.create('SamosAdmin.movimentos.movimento.Model');
                const original = vm.get('model');
    
                novo.set(queryExportacao.results[0]);
                novo.phantom = false;
                novo.store = deps.list.getViewModel().getStore('main');
    
                this.atualizarViews(deps, novo);
    
                form.model = novo;
                
                vm.set({
                    'model'        : novo,
                    'initialValues': novo,
                    'readOnly'     : !configs.getMovimentos().alterarAposExportar,
                    'previousModel': undefined,
                    'editionClosed': !configs.getMovimentos().alterarAposExportar,
                    'listName'     : deps.list.title
                });
    
                Ext.defer(() => vm.set('forceChangeId', Math.random()), 600);
    
                Movimento.services.Descontos.atualizarControlesDesconto(form.model, form);

                await SamosUtils.Utils.sleep(1000);

                vm.set({
                    hideParaPedido:                    vm.checkExportacao('PED', 'Pedidos'),
                    hideParaDevolucao:                 vm.checkExportacao('DEV', 'Devoluções'),
                    hideParaNotaEletronica:            vm.checkExportacao('NFE', 'Nota Eletrônica'),
                    hideParaRequisicao:                vm.checkExportacao('REQ', 'Requisições'),
                    hideParaRomaneioEntrega:           vm.checkExportacao('ENT', 'Romaneio Entrega'),
                    hideParaRomaneioClienteRetirou:    vm.checkExportacao('ENT', 'Romaneio Entrega'),
                    hideParaRomaneioEntregueOrcamento: vm.checkExportacao('ENT', 'Romaneio Entrega'),
                    hideParaRomaneioMontagem:          vm.checkExportacao('MON', 'Romaneio Montagem')
                });

                if(vm.get('isNota')){
                    Movimento.services.Model.updateUltimoDoctoNFE();
                }

                results.push(...[novo, original]);
            }
                
            Ext.Note('success', 'Exportado com sucesso');

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao exportar movimento');
        }

        form.stopGauge();

        return results;
    },

    exportarPeloFrontend: async function(deps) {
        const form = deps.form;
        const ctrlMovimento = form.getController();
        const campoObservacoes = ctrlMovimento.lookup('observacoes');

        this.atualizarViews(deps);

        const models = await this.atualizarDataModel(form, deps.list);

        SamosUtils.Events.enableWarnReload();

        if(campoObservacoes) {
            campoObservacoes.focus.call(campoObservacoes, true);
        } else {
            ctrlMovimento.doDefaultFocus.call(ctrlMovimento); 
        }

        Movimento.services.Descontos.atualizarControlesDesconto(models[1], form);

        return models;
    },

    atualizarViews: function(deps, novo) {
        const form = deps.form;     
        const list = deps.list;
        const tabs = list.up('tabpanel').getTabBar().items.items;
        const tabListMovimento = tabs.find(tab => tab.card.xtype == list.xtype);
        const tabFormMovimento = tabs.find(tab => tab.card.xtype == form.xtype);
        const btnNovoList = list.down('button[reference="novo"]');
        const btnNovo     = form.down('button[reference="novo"]');
        const btnAlterar  = form.down('button[reference="alterar"]');
        const btnExcluir  = form.down('button[reference="excluir"]');
        const btnCaixa    = form.down('button[reference="caixa"]');

        form.emExportacao = !novo;

        list.title     = deps.listTitle;
        form.title     = deps.formTitle;
        form.listName  = deps.listTitle;

        list.getViewModel().getStore('main').removeAll();

        if(tabListMovimento){
            tabListMovimento.setText(deps.listTitle);
        }
        
        if(tabFormMovimento){
            tabFormMovimento.setText(deps.formTitle);
        }

        const permissoes = Permissao.services.Model.get({
            groupName: 'Movimentos',
            moduleName: deps.listTitle
        });

        if(permissoes.create  === false || permissoes.create  === 'F'){
            if(btnNovoList) {
                btnNovoList.destroy();
            }
            if(btnNovo) {
                btnNovo.destroy();
            }
        }

        if(btnAlterar && (permissoes.update  === false || permissoes.update  === 'F')){
            btnAlterar.destroy();
        }

        if(btnExcluir && (permissoes.destroy  === false || permissoes.destroy  === 'F')){
            btnExcluir.destroy();
        }

        list.setPermissoes({
            lockNovo:    permissoes.create  === false || permissoes.create  === 'F',
            lockAlterar: permissoes.update  === false || permissoes.update  === 'F',
            lockExcluir: permissoes.destroy === false || permissoes.destroy === 'F'
        });

        if(btnCaixa) {
            if(!configs.getEmpresa().regimeCaixa) {
                btnCaixa.setText('Pagamento');
            } else {
                btnCaixa.setText('Caixa');
            }
        }

        if(
            configs.getMovimentos().ramoRomaneio == 'moveis' &&
            form.title == 'Pedido'
        ){
            const btnOpcoes = form.down('button[text="Opções"]');
            if(btnOpcoes) {
                btnOpcoes.getEl().dom.style.backgroundColor = 'yellow';
                btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
            }

            if(btnCaixa){
                if((novo && novo.get('MOVIMENTOS_STATUS') != 'F') || !novo){
                    btnCaixa.getEl().dom.style.backgroundColor = 'yellow';
                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                }
            }
        }
    },

    atualizarDataModel: async function(form, list) {
        const nomeDocumento = list.title;
        const novo = Ext.create('SamosAdmin.movimentos.movimento.Model');
        const original = form.getViewModel().get('model');
        const models = [novo, original];

        novo.set(novo.getIdProperty(), 0);
        form.model = novo;
        form.getViewModel().set({
            'model':         novo,
            'initialValues': original.getData(),
            'readOnly':      false,
            'previousModel': original,
            'editionClosed': !form.down('button[text="Fechar"]'),
            'listName':      list.title
        });

        this.adicionarNfeAosMovimentosVinculados([novo, [original]]);    
        this.guardarOriginaisParaAtualizar([original]);
        this.copiarCamposDoOriginal(models);
        
        await Movimento.services.Model.definirValoresPadrao(form, nomeDocumento);  
        
        if(configs.getMovimentos().carregaVendedorPessoa) {
            novo.set({
                'MOVIMENTOS_ID_USUARIOS': original.get('MOVIMENTOS_ID_USUARIOS'),
                'USUARIOS_NOME'         : original.get('USUARIOS_NOME'),
                'USUARIOS_LOGIN'        : original.get('USUARIOS_LOGIN')
            });    
        }
        
        novo.set({
            'MOVIMENTOS_ID_PRAZOS': original.get('MOVIMENTOS_ID_PRAZOS'),
            'PRAZOS_NOME':          original.get('PRAZOS_NOME')
        });

        await this.gerarCaixaAPartirDaFormaDePagamento(models);
        this.validarEntrega(form, novo);
        this.setarCamposDePesquisa(models);
        form.getController().checkOperacao();

        return models;
    },
    
    /**
     * Importacao/Exportacao
     */

    copiarCamposDoOriginal: function(models) {
        const [novo, original] = models;
        const formMovimento = Ext.$('formmovimentos')[0];
        const campoPessoa = formMovimento.lookup('pessoa');
        const resetarIdsFn = Movimento.services.Filhos.resetarIds;
        const transporteOriginal = novo.get('MOVIMENTOS_ENVIO');
        const caixaOriginal  = novo.get('MOVIMENTOS_CAIXA');
        const movimentosVinculados = transporteOriginal[0]['MOVIMENTOSENVIO_REFERENTE'];

        campoPessoa.suspendEvents();//para não apagar os campos trazidos ao mudar o id

        let idUsuarioOrigem, nmUsuarioOrigem, lgUsuarioOrigem;

        if(configs.getMovimentos().carregaVendedorPessoa) {
            idUsuarioOrigem = original.get('MOVIMENTOS_ID_USUARIOS');
            nmUsuarioOrigem = original.get('USUARIOS_NOME');
            lgUsuarioOrigem = original.get('USUARIOS_LOGIN');
        } else {
            idUsuarioOrigem = configs.getMovimentos().carregaVendedor ? configs.getUsuario().id   : original.get('MOVIMENTOS_ID_USUARIOS');
            nmUsuarioOrigem = configs.getUsuario().nome;
            lgUsuarioOrigem = configs.getUsuario().login;
        }
        
        novo.set({
            'MOVIMENTOS_ID_EMPRESAORIGEM': original.get('MOVIMENTOS_ID_EMPRESAS'),
            'MOVIMENTOS_NUMEROORIGEM':     original.get('MOVIMENTOS_NUMERO'),
            'MOVIMENTOS_SERIEORIGEM':      original.get('MOVIMENTOS_SERIE'),
            'MOVIMENTOS_ID_PESSOAS':       original.get('MOVIMENTOS_ID_PESSOAS'),
            'MOVIMENTOS_NOME':             original.get('MOVIMENTOS_NOME'),
            'MOVIMENTOS_ID_USUARIOS':      idUsuarioOrigem,
            'USUARIOS_NOME':               nmUsuarioOrigem,
            'USUARIOS_LOGIN':              lgUsuarioOrigem,
            'MOVIMENTOS_ID_PRAZOS':        original.get('MOVIMENTOS_ID_PRAZOS'),
            'PRAZOS_NOME':                 original.get('PRAZOS_NOME'),
            'MOVIMENTOS_CPFCNPJ':          original.get('MOVIMENTOS_CPFCNPJ'),
            'PESSOAS_ID_CIDADES':          original.get('PESSOAS_ID_CIDADES'),
            'PESSOAS_TELEFONE':            original.get('PESSOAS_TELEFONE'),
            'MOVIMENTOS_CELULAR':          original.get('MOVIMENTOS_CELULAR'),
            'CIDADES_NOME':                original.get('CIDADES_NOME'),
            'CIDADES_ESTADO':              original.get('CIDADES_ESTADO'),
            'MOVIMENTOS_EMAIL':            original.get('MOVIMENTOS_EMAIL'),
            'MOVIMENTOS_FRETE':            original.get('MOVIMENTOS_FRETE'),
            'MOVIMENTOS_IMPOSTO':          original.get('MOVIMENTOS_IMPOSTO'),
            'MOVIMENTOS_DESCONTOS':        original.get('MOVIMENTOS_DESCONTOS'),
            'MOVIMENTOS_PERCENTUAL':       original.get('MOVIMENTOS_PERCENTUAL'),
            'MOVIMENTOS_PRODUTOS':         original.get('MOVIMENTOS_PRODUTOS'),
            'MOVIMENTOS_SEGURO':           configs.getMovimentos().usarMarkup ? 0 : original.get('MOVIMENTOS_SEGURO'),
            'MOVIMENTOS_DESPESAS':         original.get('MOVIMENTOS_DESPESAS'),
            'MOVIMENTOS_TOTAL':            original.get('MOVIMENTOS_TOTAL'),
            'MOVIMENTOS_OBSERVACOES':      original.get('MOVIMENTOS_OBSERVACOES'),
            'MONTAGENS_VALOR':             original.get('MONTAGENS_VALOR'),
            'MOVIMENTOS_ITENS':            resetarIdsFn(original, 'MOVIMENTOS_ITENS',           'MOVIMENTOSITENS_ID'),
            'MOVIMENTOS_FORMASPAGAMENTO':  resetarIdsFn(original, 'MOVIMENTOS_FORMASPAGAMENTO', 'MOVIMENTOSFORMAS_ID'),
            'MOVIMENTOS_CAIXA':            resetarIdsFn(original, 'MOVIMENTOS_CAIXA',           'MOVIMENTOSCAIXA_ID'),
            'MOVIMENTOS_ENVIO':            resetarIdsFn(original, 'MOVIMENTOS_ENVIO',           'MOVIMENTOSENVIO_ID'),
            'MOVIMENTOS_CARTOES':          resetarIdsFn(original, 'MOVIMENTOS_CARTOES',         'CARTOES_ID'),
            'MOVIMENTOS_CHEQUES':          resetarIdsFn(original, 'MOVIMENTOS_CHEQUES',         'CHEQUES_ID'),
            'MOVIMENTOS_FINANCEIROS':      resetarIdsFn(original, 'MOVIMENTOS_FINANCEIROS',     'FINANCEIROS_ID')
        });

        if(!novo.get('MOVIMENTOS_ENVIO').length) {
            novo.set('MOVIMENTOS_ENVIO', transporteOriginal);
        }

        if(!novo.get('MOVIMENTOS_CAIXA').length) {
            novo.set('MOVIMENTOS_CAIXA', caixaOriginal);
        }

        const itensNovo = novo.get(`MOVIMENTOS_ITENS`)

        //faz a junção de itens repetidos

        const itensAgrupados = itensNovo.reduce((res, item) => {

            const existente = res.find(r => r['MOVIMENTOSITENS_ID_PRODUTOS'] == item['MOVIMENTOSITENS_ID_PRODUTOS']);
            
            if(!existente) {
                res.push(item);
            } else {
                existente['MOVIMENTOSITENS_QUANTIDADE'] = ((grams(existente['MOVIMENTOSITENS_QUANTIDADE']) + grams(item['MOVIMENTOSITENS_QUANTIDADE'])) / 1000);
                existente['VALOR_LIQUIDO']              = ((cents(existente['VALOR_LIQUIDO'])              + cents(item['VALOR_LIQUIDO'])) / 100);
                existente['TOTAL_LIQUIDO']              = ((cents(existente['TOTAL_LIQUIDO'])              + cents(item['TOTAL_LIQUIDO'])) / 100);
                existente['MOVIMENTOSITENS_TOTAL']      = parseFloat(((cents(existente['MOVIMENTOSITENS_TOTAL']) + cents(item['MOVIMENTOSITENS_TOTAL'])) / 100).toFixed(2));
                existente['MOVIMENTOSITENS_PRECO']      = parseFloat(((cents(existente['MOVIMENTOSITENS_TOTAL']) / grams(existente['MOVIMENTOSITENS_QUANTIDADE'])) * 10).toFixed(2));
            }

            return res;
            
        }, []);

        // Fim da junção.

        novo.set(`MOVIMENTOS_ITENS`, itensAgrupados);

        novo.get('MOVIMENTOS_ENVIO')[0]['MOVIMENTOSENVIO_REFERENTE'] = movimentosVinculados;        
        Ext.defer(campoPessoa.resumeEvents, 500, campoPessoa);

        return [ novo, original ];
    },

    copiarCamposDaOS: function(models) {  // Ordem de serviço = Original
        const [original] = models;

        const formMovimento = Ext.$('formmovimentos')[0];
        const campoPessoa  = formMovimento.lookup('pessoa');        
        let itensMovimento = [];
        let somaOrdens = 0;

        const ufConsumidor = original.get('CIDADES_ESTADO');
        const ufEmpresa = configs.getPermissao()['CIDADES_ESTADO'];
        const cst = ufConsumidor == ufEmpresa ? 'CSTLOCAL' : 'CSTOUTROS';

        for(let i in models) {
            somaOrdens += cents(models[i].data['ORDENS_TOTAL']);
            const dataItem = {
                'MOVIMENTOSITENS_ID_PRODUTOS':   models[i].data['ORDENS_IDSKY'],
                'PRODUTOS_NOME':                 models[i].data['PRODUTOS_NOME'],
                'MOVIMENTOSITENS_CST':           models[i].data[`SALDOS_${cst}`],
                'MOVIMENTOSITENS_QUANTIDADE':    1,
                'MOVIMENTOSITENS_PRECO':         models[i].data['ORDENS_TOTAL'],
                'MOVIMENTOSITENS_CUSTO':         models[i].data['ORDENS_TOTAL'],
                'VALOR_LIQUIDO':                 models[i].data['ORDENS_TOTAL'],
                'MOVIMENTOSITENS_DESCONTOS':     models[i].data['ORDENS_DESCONTOS'],
                'TOTAL_LIQUIDO':                 models[i].data['ORDENS_TOTAL'],
                'MOVIMENTOSITENS_TOTAL':         models[i].data['ORDENS_TOTAL']
            };

            itensMovimento.push(dataItem);
        }

        let novo = formMovimento.getViewModel().get('model');

        campoPessoa.suspendEvents();//para não apagar os campos trazidos ao mudar o id
        
        novo.set({
            'MOVIMENTOS_ID_EMPRESAORIGEM': original.get('ORDENS_ID_EMPRESAS'),
            'MOVIMENTOS_NUMEROORIGEM':     original.get('ORDENS_NUMERO'),
            'MOVIMENTOS_SERIEORIGEM':      original.get('ORDENS_SERIE'),
            'MOVIMENTOS_ID_PESSOAS':       original.get('ORDENS_ID_PESSOAS'),
            'MOVIMENTOS_NOME':             original.get('ORDENS_NOME'),
            'MOVIMENTOS_ID_USUARIOS':      configs.getMovimentos().carregaVendedor ? configs.getUsuario().id   : original.get('ORDENS_ID_USUARIOS'),
            'USUARIOS_NOME':               configs.getMovimentos().carregaVendedor ? configs.getUsuario().nome : original.get('USUARIOS_LOGIN'),
            'USUARIOS_LOGIN':              configs.getUsuario().login,
            'MOVIMENTOS_ID_PRAZOS':        original.get('ORDENS_ID_PRAZOS'),
            'PRAZOS_NOME':                 original.get('PRAZOS_NOME'),
            'MOVIMENTOS_CPFCNPJ':          original.get('ORDENS_CPFCNPJ'),
            'PESSOAS_ID_CIDADES':          original.get('PESSOAS_ID_CIDADES'),
            'PESSOAS_TELEFONE':            original.get('PESSOAS_TELEFONE'),
            'MOVIMENTOS_CELULAR':          original.get('PESSOAS_CELULAR'),
            'CIDADES_NOME':                original.get('CIDADES_NOME'),
            'CIDADES_ESTADO':              original.get('CIDADES_ESTADO'),
            'MOVIMENTOS_EMAIL':            original.get('ORDENS_EMAIL'),
            'MOVIMENTOS_DESCONTOS':        original.get('ORDENS_DESCONTOS'),
            'MOVIMENTOS_PRODUTOS':         original.get('ORDENS_PRODUTOS'),
            'MOVIMENTOS_TOTAL':            (somaOrdens / 100),
            'MOVIMENTOS_OBSERVACOES':      original.get('ORDENS_OBSERVACOES'),
            'MOVIMENTOS_ITENS':            itensMovimento
        });

        Ext.defer(campoPessoa.resumeEvents, 500, campoPessoa);

        return [ novo, original ];
    },
    
    gerarCaixaAPartirDaFormaDePagamento: async function(models) {
        const [novo, original] = models;
        const formasDePagamento = original.get('MOVIMENTOS_FORMASPAGAMENTO') ? original.get('MOVIMENTOS_FORMASPAGAMENTO')[0] : null;

        if(formasDePagamento) {
            const prcCredito    = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCCREDITO']    || 0);
            const prcChequePre  = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCCHEQUEPRE']  || 0);
            const prcCarne      = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCDUPLICATA']  || 0);
            const prcFinanceira = parseInt(formasDePagamento['MOVIMENTOSFORMAS_PRCFINANCEIRA'] || 0);

            const vlrDinheiro       = cents(formasDePagamento['MOVIMENTOSFORMAS_DINHEIRO']);
            const vlrTransferencias = cents(formasDePagamento['MOVIMENTOSFORMAS_TRANSFERENCIAS']);
            const vlrDebito         = cents(formasDePagamento['MOVIMENTOSFORMAS_DEBITO']);
            const vlrCredito        = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRCREDITO'])    * prcCredito;
            const vlrCheque         = cents(formasDePagamento['MOVIMENTOSFORMAS_CHEQUE']);
            const vlrChequePre      = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRCHEQUEPRE'])  * prcChequePre;
            const vlrCarne          = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRDUPLICATA'])  * prcCarne;
            const vlrFinanceira     = cents(formasDePagamento['MOVIMENTOSFORMAS_FINANCEIRA']); 
            const vlpFinanceira     = cents(formasDePagamento['MOVIMENTOSFORMAS_VLRFINANCEIRA']) * prcFinanceira;
            const vctChequePre      = momentTz(formasDePagamento['MOVIMENTOSFORMAS_VCTCHEQUEPRE']  || '1899-12-30');
            const vctCarne          = momentTz(formasDePagamento['MOVIMENTOSFORMAS_VCTDUPLICATA']  || '1899-12-30');
            const vctFinanceira     = momentTz(formasDePagamento['MOVIMENTOSFORMAS_VCTFINANCEIRA'] || '1899-12-30');
            
            const cartoes     = [];
            const cheques     = [];
            const financeiros = [];
            
            const caixa = Ext.create('SamosFinanceiros.titulos.ModelCaixa');
            const dataCaixa = {
                'MOVIMENTOSCAIXA_ID':             -1,
                'MOVIMENTOSCAIXA_ID_PESSOAS':     original.get('MOVIMENTOS_ID_PESSOAS'),
                'MOVIMENTOSCAIXA_ID_APLICACOES':  novo.get('OPERACOES_ID_APLICACOES'),
                'MOVIMENTOSCAIXA_NOME':           '[SERIE] [NUMERO] ' + original.get('MOVIMENTOS_NOME').toString().replace(/'/ig, ''),
                'MOVIMENTOSCAIXA_TIPO':           novo.get('OPERACOES_TIPO') == 'E' ? 'S' : 'E',
                'MOVIMENTOSCAIXA_DINHEIRO':       vlrDinheiro / 100,
                'MOVIMENTOSCAIXA_TRANSFERENCIAS': vlrTransferencias / 100,
                'MOVIMENTOSCAIXA_DEBITO':         vlrDebito / 100,
                'MOVIMENTOSCAIXA_CHEQUE':         (vlrCheque + vlrChequePre) / 100,
                'MOVIMENTOSCAIXA_CREDITO':        vlrCredito / 100,
                'MOVIMENTOSCAIXA_DUPLICATA':      vlrCarne / 100,
                'MOVIMENTOSCAIXA_OUTRO':          vlrFinanceira / 100,
                'MOVIMENTOSCAIXA_VENCIMENTO':     momentServer().format('YYYY-MM-DD'),
                'MOVIMENTOSCAIXA_EXPORTADO':      'N'
            };
    
            caixa.set(dataCaixa);
    
            if(vlrDebito > 0) {
                const debito = Ext.create('SamosFinanceiros.cartoes.Model');
                const dataDebito = {
                    'CARTOES_ID'           : -1,
                    'CARTOES_TIPO'         : 'D',
                    'CARTOES_PARCELAS'     : 1,
                    'CARTOES_VALOR'        : vlrDebito / 100,
                    'CARTOES_EMISSAO'      : momentServer().format('YYYY-MM-DD'),
                    'CARTOES_ORIGEM'       : novo.get('MOVIMENTOS_NUMERO'),
                    'CARTOES_SERIE'        : novo.get('MOVIMENTOS_SERIE'),
                    'CARTOES_PAGO'         : 0,
                    'CARTOES_TAXA'         : 0,
                    'CARTOES_ID_OPERADORAS': 0,
                    'CARTOES_ID_MOVIMENTOS': novo.get('MOVIMENTOS_ID'),
                    'CARTOES_ID_DOCUMENTOS': novo.get('MOVIMENTOS_ID_DOCUMENTOS')
                }

                debito.set(dataDebito);
                cartoes.push(debito.data);
            }
    
            if(vlrCredito > 0) {
                const credito = Ext.create('SamosFinanceiros.cartoes.Model');
                const dataCredito = {
                    'CARTOES_ID'           : -2,
                    'CARTOES_TIPO'         : 'C',
                    'CARTOES_PARCELAS'     : prcCredito,
                    'CARTOES_VALOR'        : vlrCredito / 100,
                    'CARTOES_EMISSAO'      : momentServer().format('YYYY-MM-DD'),
                    'CARTOES_ORIGEM'       : novo.get('MOVIMENTOS_NUMERO'),
                    'CARTOES_SERIE'        : novo.get('MOVIMENTOS_SERIE'),
                    'CARTOES_PAGO'         : 0,
                    'CARTOES_TAXA'         : 0,
                    'CARTOES_ID_OPERADORAS': 0,
                    'CARTOES_ID_MOVIMENTOS': novo.get('MOVIMENTOS_ID'),
                    'CARTOES_ID_DOCUMENTOS': novo.get('MOVIMENTOS_ID_DOCUMENTOS')
                }

                credito.set(dataCredito);
                cartoes.push(credito.data);
            }
    
            if(vlrCheque > 0) {
                const cheque = Ext.create('SamosFinanceiros.cheques.Model');
                const dataCheque = {
                    'CHEQUES_ID':            -1,
                    'CHEQUES_ID_MOVIMENTOS': novo.get('MOVIMENTOS_ID'),
                    'CHEQUES_ORIGEM':        novo.get('MOVIMENTOS_NUMERO'),
                    'CHEQUES_SERIE':         novo.get('MOVIMENTOS_SERIE'),
                    'CHEQUES_ID_DOCUMENTOS': novo.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    'CHEQUES_ID_BANCOS':     0,
                    'CHEQUES_AGENCIA':       '',
                    'CHEQUES_CONTA':         '',
                    'CHEQUES_NUMERO':        '',
                    'CHEQUES_VALOR':         vlrCheque / 100,
                    'CHEQUES_EMISSAO':       momentServer().format('YYYY-MM-DD'),
                    'CHEQUES_LANCADO':       momentServer().format('YYYY-MM-DD'),
                    'CHEQUES_VENCIMENTO':    momentServer().format('YYYY-MM-DD'),
                    'CHEQUES_DEPOSITO':      '1899-12-30',
                    'CHEQUES_REPASSE':       '1899-12-30',
                    'CHEQUES_BAIXA':         '1899-12-30',
                    'CHEQUES_CPFCNPJ':       SamosUtils.String.onlyNumbers(original.get('MOVIMENTOS_CPFCNPJ')),
                    'CHEQUES_NOME':          original.get('MOVIMENTOS_NOME'),
                    'CHEQUES_ENDERECO':      original.get('PESSOAS_ENDERECO'),
                    'CHEQUES_NRORESIDENCIA': original.get('PESSOAS_NUMERO'),
                    'CHEQUES_BAIRRO':        original.get('PESSOAS_BAIRRO'),
                    'CHEQUES_CEP':           SamosUtils.String.onlyNumbers(original.get('PESSOAS_CEP')),
                    'CHEQUES_TELEFONE':      SamosUtils.String.onlyNumbers(original.get('PESSOAS_TELEFONE')),
                    'CHEQUES_CELULAR':       SamosUtils.String.onlyNumbers(original.get('MOVIMENTOS_CELULAR')),
                    'CHEQUES_ID_CIDADES':    original.get('PESSOAS_ID_CIDADES')
                }

                cheque.set(dataCheque);
                cheques.push(cheque.data);
            }
    
            if(vlrChequePre > 0) {
                const parcelamento = [];
                for (let i = 0; i < prcChequePre; i++) {
                    parcelamento.push(i * 30);
                }
        
                const resto = vlrChequePre % parcelamento.length;
        
                parcelamento.forEach((days, index) => {
                    const vcto = momentTz(vctChequePre).add(days, 'days');
                    const vlrOriginal = parseInt(vlrChequePre / prcChequePre) / 100 + (index === 0 ? resto / 100 : 0);
                    const chequePre = Ext.create('SamosFinanceiros.cheques.Model');
                    const dataChequePre = {
                        'CHEQUES_ID':            (index + 2) * -1,
                        'CHEQUES_ID_EMPRESAS':   novo.get('MOVIMENTOS_ID_EMPRESAS'),
                        'CHEQUES_ID_BANCOS':     0,
                        'CHEQUES_AGENCIA':       '',
                        'CHEQUES_CONTA':         '',
                        'CHEQUES_NUMERO':        '',
                        'CHEQUES_ORIGEM':        novo.get('MOVIMENTOS_NUMERO'), 
                        'CHEQUES_SERIE':         novo.get('MOVIMENTOS_SERIE'), 
                        'CHEQUES_ID_MOVIMENTOS': novo.get('MOVIMENTOS_ID'), 
                        'CHEQUES_ID_DOCUMENTOS': novo.get('MOVIMENTOS_ID_DOCUMENTOS'), 
                        'CHEQUES_CPFCNPJ':       SamosUtils.String.onlyNumbers(original.get('MOVIMENTOS_CPFCNPJ')),
                        'CHEQUES_NOME':          original.get('MOVIMENTOS_NOME'),
                        'CHEQUES_ENDERECO':      original.get('PESSOAS_ENDERECO'),
                        'CHEQUES_NRORESIDENCIA': original.get('PESSOAS_NUMERO'),
                        'CHEQUES_BAIRRO':        original.get('PESSOAS_BAIRRO'),
                        'CHEQUES_CEP':           SamosUtils.String.onlyNumbers(original.get('PESSOAS_CEP')),
                        'CHEQUES_TELEFONE':      SamosUtils.String.onlyNumbers(original.get('PESSOAS_TELEFONE')),
                        'CHEQUES_CELULAR':       SamosUtils.String.onlyNumbers(original.get('MOVIMENTOS_CELULAR')),
                        'CHEQUES_ID_CIDADES':    original.get('PESSOAS_ID_CIDADES'),
                        'CIDADES_NOME':          original.get('CIDADES_NOME'),
                        'CIDADES_ESTADO':        original.get('CIDADES_ESTADO'),
                        'CHEQUES_LOG':           SamosUtils.Info.getLog(),
                        'CHEQUES_EMISSAO':       momentServer().format('YYYY-MM-DD'),
                        'CHEQUES_LANCADO':       momentServer().format('YYYY-MM-DD'),
                        'CHEQUES_VENCIMENTO':    vcto.format('YYYY-MM-DD'),
                        'CHEQUES_DEPOSITO':      '1899-12-30',
                        'CHEQUES_REPASSE':       '1899-12-30',
                        'CHEQUES_BAIXA':         '1899-12-30',
                        'CHEQUES_VALOR':         vlrOriginal,
                        'CHEQUES_STATUS':        'A'
                    };

                    chequePre.set(dataChequePre);
                    cheques.push(chequePre.data);
                });
            }
    
            if(vlrCarne > 0) {
                const parcelamento = [];
                for (let i = 0; i < prcCarne; i++) {
                    parcelamento.push(i * 30);
                }

                const resto     = vlrCarne % parcelamento.length;
                const prazo     = await Prazo.services.Model.get(prcCarne);
                const idPrazo   = prazo && prazo.get('PRAZOS_ID')   ? prazo.get('PRAZOS_ID')   : novo.get('MOVIMENTOS_ID_PRAZOS');
                const nomePrazo = prazo && prazo.get('PRAZOS_NOME') ? prazo.get('PRAZOS_NOME') : novo.get('PRAZOS_NOME');

                novo.set({
                    'MOVIMENTOS_ID_PRAZOS': idPrazo,
                    'PRAZOS_NOME'         : nomePrazo
                });

                parcelamento.forEach((days, index) => {
                    const vcto = momentTz(vctCarne).add(days, 'days');
                    const vlrOriginal = cents(parseInt(vlrCarne / prcCarne) / 100) + (index === 0 ? resto : 0);

                    const carne = Ext.create('SamosFinanceiros.titulos.Model');
                    const dataCarne = {
                        'FINANCEIROS_ID':            (index + 2) * -1,
                        'FINANCEIROS_NUMERO':        novo.get('MOVIMENTOS_NUMERO'), 
                        'FINANCEIROS_SERIE':         novo.get('MOVIMENTOS_SERIE'), 
                        'FINANCEIROS_TIPO':          novo.get('OPERACOES_FINANCEIRO'), 
                        'FINANCEIROS_ID_MOVIMENTOS': novo.get('MOVIMENTOS_ID'), 
                        'FINANCEIROS_ID_DOCUMENTOS': novo.get('MOVIMENTOS_ID_DOCUMENTOS'), 
                        'FINANCEIROS_ID_PESSOAS':    novo.get('MOVIMENTOS_ID_PESSOAS'),
                        'FINANCEIROS_ID_USUARIOS':   novo.get('MOVIMENTOS_ID_USUARIOS'),
                        'FINANCEIROS_ID_PORTADORES': configs.getPermissao()['EMPRESAS_ID_PORTADORES'],
                        'FINANCEIROS_ID_APLICACOES': novo.get('OPERACOES_ID_APLICACOES') || 1,
                        'FINANCEIROS_ID_PRAZOS':     idPrazo,
                        'FINANCEIROS_PARCELAS':      prcCarne,
                        'FINANCEIROS_PARCELA':       index + 1,
                        'FINANCEIROS_EMISSAO':       momentServer().format('YYYY-MM-DD'),
                        'FINANCEIROS_VENCIMENTO':    vcto.format('YYYY-MM-DD'),
                        'FINANCEIROS_BAIXA':         '1899-12-30',
                        'FINANCEIROS_PAGAMENTO':     '1899-12-30',
                        'FINANCEIROS_ORIGINAL':      vlrOriginal / 100,
                        'FINANCEIROS_ABERTO':        vlrOriginal / 100,
                        'FINANCEIROS_PAGO':          0,
                        'FINANCEIROS_TOTAL':         vlrCarne / 100,
                        'FINANCEIROS_STATUS':        'A'
                    }

                    carne.set(dataCarne);
                    financeiros.push(carne.data);
                });
            }
    
            if(vlrFinanceira > 0) {
                const financeira = Ext.create('SamosFinanceiros.titulos.Model');
                const dataFinanceira = { 
                    'FINANCEIROS_ID':            -1,
                    'FINANCEIROS_NUMERO':        novo.get('MOVIMENTOS_NUMERO'), 
                    'FINANCEIROS_SERIE':         novo.get('MOVIMENTOS_SERIE'), 
                    'FINANCEIROS_TIPO':          novo.get('OPERACOES_FINANCEIRO'), 
                    'FINANCEIROS_ID_MOVIMENTOS': novo.get('MOVIMENTOS_ID'), 
                    'FINANCEIROS_ID_DOCUMENTOS': novo.get('MOVIMENTOS_ID_DOCUMENTOS'), 
                    'FINANCEIROS_ID_PESSOAS':    '999999',
                    'FINANCEIROS_ID_USUARIOS':   novo.get('MOVIMENTOS_ID_USUARIOS'), 
                    'FINANCEIROS_ID_PORTADORES': configs.getPermissao()['EMPRESAS_ID_PORTADORES'],
                    'FINANCEIROS_ID_APLICACOES': novo.get('OPERACOES_ID_APLICACOES') || 1,
                    'FINANCEIROS_ID_PRAZOS':     0,
                    'FINANCEIROS_PARCELAS':      prcFinanceira,
                    'FINANCEIROS_PARCELA':       1,
                    'FINANCEIROS_VENCIMENTO':    vctFinanceira.format('YYYY-MM-DD'),
                    'FINANCEIROS_EMISSAO':       momentServer().format('YYYY-MM-DD'),
                    'FINANCEIROS_BAIXA':         '1899-12-30',
                    'FINANCEIROS_PAGAMENTO':     '1899-12-30',
                    'FINANCEIROS_ORIGINAL':      original.get('MOVIMENTOS_BASEST'),
                    'FINANCEIROS_ABERTO':        vlrFinanceira / 100,
                    'FINANCEIROS_PAGO':          0,
                    'FINANCEIROS_TOTAL':         vlpFinanceira / 100,
                    'FINANCEIROS_STATUS':        'A'
                }

                financeira.set(dataFinanceira);
                financeiros.push(financeira.data);
            }

            novo.set({
                'MOVIMENTOS_CAIXA':       [caixa.data],
                'MOVIMENTOS_CARTOES':     cartoes,
                'MOVIMENTOS_CHEQUES':     cheques,
                'MOVIMENTOS_FINANCEIROS': financeiros
            });

            Movimento.services.Caixa.calcularPartida();
        }

        return [ novo, original ];
    },

    validarEntrega: function(form, novo) {
        if((novo.get('MOVIMENTOS_ITENS') || []).every(item => {
            const hoje          = momentServer().hours(0).minutes(0).seconds(0);
            const temMontagem   = cents(novo.get('MONTAGENS_VALOR')) > 0;
            const dataEntrega   = momentTz(item['MOVIMENTOSITENS_DATAENTREGA']).hours(0).minutes(0).seconds(0);
            const dataMontagem  = momentTz(item['MOVIMENTOSITENS_DATAMONTAGEM']).hours(0).minutes(0).seconds(0);
            const turnoEntrega  = item['MOVIMENTOSITENS_HORAENTREGA'];
            const turnoMontagem = item['MOVIMENTOSITENS_HORAMONTAGEM'];

            if(
                !item['MOVIMENTOSITENS_DATAENTREGA']     || 
                momentTz(dataEntrega.format()).isBefore(hoje) || 
                !turnoEntrega
            ){
                return false;
            }
            
            if(momentTz(dataEntrega.format()).isSame(hoje)){
                if(
                    parseInt(momentServer().format('HH')) >= 12 &&
                    parseInt(momentServer().format('HH')) < 18 &&
                    turnoEntrega == 'M'
                ) {
                    return false;
                } else if(
                    parseInt(momentServer().format('HH')) >= 18 &&
                    (turnoEntrega == 'M' || turnoEntrega == 'T')
                ){
                    return false;
                }
            }

            if(temMontagem) {
                if(
                    !item['MOVIMENTOSITENS_DATAENTREGA'] || 
                    momentTz(dataMontagem.format()).isBefore(dataEntrega.format()) || 
                    !turnoMontagem
                ){
                    return false;
                } else if(
                    momentTz(dataMontagem.format()).isSame(dataEntrega.format()) &&
                    (
                        (
                            (turnoEntrega == 'T' || turnoEntrega == 'N') && 
                            turnoMontagem == 'M'
                        ) || 
                        turnoEntrega == 'N' && turnoMontagem == 'T'
                    )
                ){
                    return false;
                } else {
                    return true;
                }
            } else {
                return true;
            }
        })) {
            form.getViewModel().set('entregaValida', true);
        }
    },

    setarCamposDePesquisa: function(models) {
        const [novo, original] = models;
        const campoPessoa = Ext.$('formmovimentos')[0].lookup('pessoa');
        const campoVendedor = Ext.$('formmovimentos')[0].lookup('vendedor');
        const pessoa = (original.get('ORDENS_NOME') ? original.get('ORDENS_NOME') : original.get('MOVIMENTOS_NOME'));
        const vendedor = novo.get('USUARIOS_NOME');

        campoPessoa.setSearchedId(pessoa);
        campoVendedor.setSearchedId(vendedor);
        return [ novo, original ];
    },

    ajustarOperacaoItens: function(models) {
        const [novo, original] = models;
        
        (novo.get('MOVIMENTOS_ITENS') || []).forEach(item => {
            item['MOVIMENTOSITENS_ID_OPERACOES'] = novo.get('MOVIMENTOS_ID_OPERACOES');
        });
        
        return [ novo, original ];
    },

    checarSeJaExportadoOuImportado: async function(original) {
        const jaImportadoOuExportado = (
            !!original.get('MOVIMENTOS_NUMEROORIGEM') && 
            original.get('MOVIMENTOS_SERIEORIGEM') != 'TRE' && 
            original.get('MOVIMENTOS_SERIEORIGEM') != 'CP'  && 
            !original.get('MOVIMENTOS_SERIEORIGEM').match(/OR/)
        );

        if(!jaImportadoOuExportado) {
            return await SamosUtils.Msg.confirm('Deseja realmente exportar/importar?');
        }
        
        const userConfirm = await SamosUtils.Msg.confirm('Movimento(s) <b>já importado(s)/exportado(s)</b>. Deseja prosseguir?');
        
        if(!userConfirm) {
            return false;
        }

        if(configs.getUsuario().privilegiado) {
            return true;
        }

        await SamosUtils.Utils.sleep(200);

        try {
            const nivel = 1;
    
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)

            const numero  = original.get('MOVIMENTOS_NUMERO');
            const serie   = original.get('MOVIMENTOS_SERIE');
            const empresa = original.get('MOVIMENTOS_ID_EMPRESAS');

            //gera log sem await, usuário não precisa esperar
            SamosUtils.Request.nodeApi({
                url: `/processos/gerarlog`,
                method: 'POST',
                query: {
                    senhaNivel: true,
                    log: `Movimento re-importado/re-exportado (${numero}|${serie}|${empresa})`
                }
            });

            return true;

        } catch(error) {
            //não autorizado
            return false;
        }
    },

    obterMovimentosCompletos: async function(originais) {
        const form = Ext.$('formmovimentos')[0]      ||  
                     Ext.$('emissaoetiquetas')[0]    || 
                     Ext.$('formromaneiosmoveis')[0] ||           
                     Ext.$('formromaneiosconstrucao')[0];

        form.initGauge();

        const ids = originais.reduce((result, movimento) => {
            return result += movimento.get('MOVIMENTOS_ID') + ',';
        }, '').slice(0,-1);

        const movimentos = await Movimento.services.Model.get(ids);
        
        form.stopGauge();

        return movimentos;
    },

    obterOSCompleta: async function(originais) {

        const form = Ext.$('formmovimentos')[0]

        form.initGauge();

        const ids = originais.reduce((result, ordem) => {
            return result += ordem.get('ORDENS_ID') + ',';
        }, '').slice(0,-1);

        const ordens = await Ordemturbos.services.Model.get(ids);

        form.getViewModel().set('movimentosOriginais', ordens);

        form.stopGauge();

        return ordens;
    },

    guardarOriginaisParaAtualizar: function(originais) {
        const form = Ext.$('formmovimentos')[0];
        form.getViewModel().set('movimentosOriginais', originais);
        return originais;
    },

    atualizarOperacao: function(models) {
        const [novo, original] = models;
        const ufEmpresa = configs.getPermissao()['CIDADES_ESTADO'];
        const ufCliente = novo.get('CIDADES_ESTADO');
        const txtsOperacao = Ext.$('formmovimentos')[0].query('textfield[reference^="operacao"]');
        const operacao = novo.get('MOVIMENTOS_ID_OPERACOES');
        const operacaoAtualizada = ufEmpresa != ufCliente ? 692900 : 592900;

        if(operacao != operacaoAtualizada) {
            novo.set('MOVIMENTOS_ID_OPERACOES', operacaoAtualizada);
            txtsOperacao.forEach(txt => {
                txt.setValue(operacaoAtualizada);
                txt.setSearchedId(operacaoAtualizada);
                txt.onTextSearch(txt, {type: 'script'});
            });
        }

        return [ novo, original ];
    },

    adicionarNfeAosMovimentosVinculados: function(models) {
        const [novo, originais] = models;
        const movimentosVinculados = originais.reduce((result, original) => {
            result.push(original.get('MOVIMENTOS_NFE'));
            return result;
        }, []);
        
        novo.get('MOVIMENTOS_ENVIO')[0]['MOVIMENTOSENVIO_REFERENTE'] = movimentosVinculados.join('|');
        return [novo, originais];
    },

    atualizarOriginais: function(novo, originais, ctrlMovimento) {
        const numeroDeMovimentosAgrupados = originais.length;
        
        originais.forEach((original, index) => {
            original.set({
                'MOVIMENTOS_ENTRADASAIDA':     momentServer().format('YYYY-MM-DD'),
                'MOVIMENTOS_STATUS':           'F',
                'MOVIMENTOS_ID_EMPRESAORIGEM': novo.get('MOVIMENTOS_ID_EMPRESAS'),
                'MOVIMENTOS_NUMEROORIGEM':     novo.get('MOVIMENTOS_NUMERO'),
                'MOVIMENTOS_SERIEORIGEM':      novo.get('MOVIMENTOS_SERIE')
            });

            if(configs.getClientName() == 'herbiquimica') { // mudar cfop na importação

                if(original.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0004') { // Requisicao
                    original.set({
//                      'MOVIMENTOS_ID_DOCUMENTOS': 10094,   // Muda documento pra ocultar
                        'MOVIMENTOS_ID_OPERACOES': 610000    // Muda operação pra faturada
                    });    
                    const itensAtualizados = (original.get('MOVIMENTOS_ITENS') || []).map(item => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = 610000;
                        return item;
                    });

                    original.set('MOVIMENTOS_ITENS', itensAtualizados);

                }    

            }

            if(configs.getClientName() == 'prudenaco') { // mudar cfop na importação

                if(original.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0002') { // Pedidos
                    original.set({
                        'MOVIMENTOS_ID_OPERACOES': 510000    // Muda operação pra faturada
                    });    
                    const itensAtualizados = (original.get('MOVIMENTOS_ITENS') || []).map(item => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = 510000;
                        return item;
                    });
                    original.set('MOVIMENTOS_ITENS', itensAtualizados);
                }    

            }

            if(configs.getClientName() == 'acomtf') { // mudar cfop na importação

                if(original.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0002') { // Pedido
                    original.set({
                        'MOVIMENTOS_ID_OPERACOES': 510000    // Muda operação pra pedido faturado
                    });    
                    const itensAtualizados = (original.get('MOVIMENTOS_ITENS') || []).map(item => {
                        item['MOVIMENTOSITENS_ID_OPERACOES'] = 510000;
                        return item;
                    });

                    original.set('MOVIMENTOS_ITENS', itensAtualizados);

                }    

            }

            if(novo.get('OPERACOES_FINANCEIRO') == 'R') {
                original.set('MOVIMENTOS_FINANCEIROS', []);
                original.set('MOVIMENTOS_CAIXA',       []);
                original.set('MOVIMENTOS_CARTOES',     []);
                original.set('MOVIMENTOS_CHEQUES',     []);
            }

            original.save()
                .then(() => {
                    if(index == numeroDeMovimentosAgrupados - 1) {
                        ctrlMovimento.getViewModel().set('movimentosOriginais', false);
                        setTimeout(() => {
                            ctrlMovimento.onGravacaoSucesso.call(ctrlMovimento, novo);
                        }, 200);
                    }
                })
                .catch(error => {
                    ctrlMovimento.onGravacaoFalha.call(ctrlMovimento, error);
                    ctrlMovimento.aposGravar.call(ctrlMovimento);
                });
        });
    },

    atualizarOriginalOS: function(novo, originais, ctrlMovimento) {  // Adaptado a OS

        const numeroDeMovimentosAgrupados = originais.length;
        
        originais.forEach((original, index) => {
            original.set({
                'ORDENS_REABERTURA':     momentServer().format('YYYY-MM-DD'),
                'ORDENS_STATUS':           'F',
                'ORDENS_ID_EMPRESAORIGEM': novo.get('MOVIMENTOS_ID_EMPRESAS'),
                'ORDENS_NUMEROORIGEM':     novo.get('MOVIMENTOS_NUMERO'),
                'ORDENS_SERIEORIGEM':      novo.get('MOVIMENTOS_SERIE')
            });

            original.save()
                .then(() => {
                    if(index == numeroDeMovimentosAgrupados - 1) {
                        ctrlMovimento.getViewModel().set('movimentosOriginais', false);
                        setTimeout(() => {
                            ctrlMovimento.onGravacaoSucesso.call(ctrlMovimento, novo);
                        }, 200);
                    }
                })
                .catch(error => {
                    ctrlMovimento.onGravacaoFalha.call(ctrlMovimento, error);
                    ctrlMovimento.aposGravar.call(ctrlMovimento);
                });
        });
    },

    atualizarTransferenciasEEmitirNotaEntrada: async function(notaSaida, originais, ctrlMovimento) {
        try {
            const transferenciaSaida = originais[0];
            const notaEntrada = Ext.create('SamosAdmin.movimentos.movimento.Model', Object.assign({}, notaSaida.data));
            const empresaDestino = transferenciaSaida.get('MOVIMENTOS_ID_PESSOAS');
            const empresaOrigem  = transferenciaSaida.get('MOVIMENTOS_ID_EMPRESAS');
            const obsTransfSaida = transferenciaSaida.get('MOVIMENTOS_OBSERVACOES').split('|');
            const documentoNotaEntrada = await Documento.services.Model.get('Nota Entrada', empresaDestino);
            
            ctrlMovimento.getView().initGauge('Emitindo Nota Entrada');

            const storeTransfEntrada = Ext.create('Ext.data.NodeJSStore', {
                model: 'SamosAdmin.movimentos.movimento.Model',
                proxy: {
                    url: 'server/movimentos'
                }
            });

            storeTransfEntrada.getProxy().setExtraParam('empresa', transferenciaSaida.get('MOVIMENTOS_ID_PESSOAS'));
            storeTransfEntrada.getProxy().setExtraParam('numero',  transferenciaSaida.get('MOVIMENTOS_NUMEROORIGEM'));
            storeTransfEntrada.getProxy().setExtraParam('serie',   transferenciaSaida.get('MOVIMENTOS_SERIEORIGEM'));

            const transferenciaEntrada = await storeTransfEntrada.load().then(records => records[0]);

            notaEntrada.set(notaEntrada.getIdProperty(), 0);

            notaEntrada.set({
                'MOVIMENTOS_ID_PESSOAS'      : empresaOrigem,
                'MOVIMENTOS_NOME'            : configs.getEmpresa().nome,
                'MOVIMENTOS_CPFCNPJ'         : configs.getEmpresa().cnpj,
                'MOVIMENTOS_ID_EMPRESAS'     : empresaDestino,
                'MOVIMENTOS_NUMEROORIGEM'    : transferenciaEntrada.get('MOVIMENTOS_NUMERO'),
                'MOVIMENTOS_SERIEORIGEM'     : transferenciaEntrada.get('MOVIMENTOS_SERIE'),
                'MOVIMENTOS_STATUS'          : 'F',
                'MOVIMENTOS_ENTRADASAIDA'    : momentServer().format('YYYY-MM-DD'),
                'MOVIMENTOS_ID_EMPRESAORIGEM': empresaDestino,
                'MOVIMENTOS_ENVIO'           : [],
                'MOVIMENTOS_OBSERVACOES'     : '||||||||||'
            });

            await Movimento.services.Documento.atribuirDocumento(documentoNotaEntrada, notaEntrada);

            const itensNotaEntradaAtualizados = (notaEntrada.get('MOVIMENTOS_ITENS') || []).map((item, index) => {
                item['MOVIMENTOSITENS_ID'] = (index + 1) * -1;
                item['MOVIMENTOSITENS_ID_EMPRESAS'] = empresaDestino;
                return item;
            });

            notaEntrada.set('MOVIMENTOS_ITENS', itensNotaEntradaAtualizados);
            notaEntrada.phantom = true;//para create e não update

            ctrlMovimento.colocarFilhosNoModel(notaEntrada);

            const notaEntradaSalva = await notaEntrada.save();
            const obsTransfEntrada = transferenciaEntrada.get('MOVIMENTOS_OBSERVACOES').split('|');

            obsTransfEntrada[0] = obsTransfEntrada[0] = 'Nota Entrada: Empresa ' + notaEntradaSalva.get('MOVIMENTOS_ID_EMPRESAS') + ', ' +
                                'Num ' + notaEntradaSalva.get('MOVIMENTOS_NUMERO') + ', ' +
                                'Ser ' + notaEntradaSalva.get('MOVIMENTOS_SERIE');

            obsTransfSaida[0] = 'Nota Eletrônica: Empresa ' + notaSaida.get('MOVIMENTOS_ID_EMPRESAS') + ', ' +
                                'Num ' + notaSaida.get('MOVIMENTOS_NUMERO') + ', ' +
                                'Ser ' + notaSaida.get('MOVIMENTOS_SERIE');

            obsTransfSaida[1] = obsTransfEntrada[0];

            transferenciaSaida.set({
                'MOVIMENTOS_STATUS':      'A',
                'MOVIMENTOS_OBSERVACOES': obsTransfSaida.join('|'),
                'MOVIMENTOS_CAIXA':       [],
                'MOVIMENTOS_SERIEORIGEM': transferenciaEntrada.get('MOVIMENTOS_SERIE')
            });

            transferenciaEntrada.set({
                'MOVIMENTOS_STATUS':      'A',
                'MOVIMENTOS_OBSERVACOES': obsTransfEntrada.join('|'),
                'MOVIMENTOS_CAIXA':       [],
                'MOVIMENTOS_SERIEORIGEM': transferenciaSaida.get('MOVIMENTOS_SERIE')
            });

            await transferenciaSaida.save();
            await transferenciaEntrada.save();

            ctrlMovimento.getViewModel().set('movimentosOriginais', false);
            setTimeout(() => {
                ctrlMovimento.onGravacaoSucesso.call(ctrlMovimento, notaSaida);
                ctrlMovimento.aposGravar.call(ctrlMovimento);
            }, 200);
        } catch (error) {
            ctrlMovimento.onGravacaoFalha.call(ctrlMovimento, error);
            ctrlMovimento.aposGravar.call(ctrlMovimento);
        }
    },


    //Para movimentos em outros modulos

    paraRomaneioEntrega: function(form, list) {
        Movimento.services.ImportacaoExportacao.paraRomaneio(form, list, 'Entrega');
    },

    paraRomaneioMontagem: function(form, list) {
        Movimento.services.ImportacaoExportacao.paraRomaneio(form, list, 'Montagem');
    },

    paraRomaneio: async function(form, list, tipo) {
        const movimento = form.model;
        const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
        let listRomaneio = Ext.$('romaneiosmoveis')[0];
        const romaneio = Ext.create('SamosAdmin.movimentos.romaneiosmoveis.Model');
        
        if(!listRomaneio) {
            const permissoes = Permissao.services.Model.get({
                groupName: 'Movimentos',
                moduleName: 'Romaneio ' + tipo
            });

            listRomaneio = tabpanel.add({
                xtype: 'romaneiosmoveis',
                title: 'Romaneio ' + tipo,
                permissoes: {
                    lockNovo:    permissoes.create  === false || permissoes.create  === 'F',
                    lockAlterar: permissoes.update  === false || permissoes.update  === 'F',
                    lockExcluir: permissoes.destroy === false || permissoes.destroy === 'F'
                }
            });
        }

        romaneio.set(romaneio.getIdProperty(), 0);

        romaneio.set({
            'ROMANEIOS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'),
            'ROMANEIOS_ID_PESSOAS'   : movimento.get('MOVIMENTOS_ID_PESSOAS'),
            'ROMANEIOS_STATUS'       : (tipo == 'Entrega' ? 'R' : 'N'),
            'ROMANEIOS_SAIDA'        : momentServer().format('YYYY-MM-DD'),
            'PESSOAS_NOME'           : movimento.get('MOVIMENTOS_NOME'),
            'PESSOAS_CPFCNPJ'        : movimento.get('MOVIMENTOS_CPFCNPJ'),
            'PESSOAS_TELEFONE'       : movimento.get('PESSOAS_TELEFONE'),
            'PESSOAS_CELULAR'        : movimento.get('MOVIMENTOS_CELULAR'),
            'PESSOAS_EMAIL'          : movimento.get('PESSOAS_EMAIL'),
            'CIDADES_NOME'           : movimento.get('CIDADES_NOME'),
            'CIDADES_ESTADO'         : movimento.get('CIDADES_ESTADO'),
            'CIDADES_IBGE'           : movimento.get('CIDADES_IBGE'),
            'PESSOAS_FORMULA'        : movimento.get('PESSOAS_FORMULA'),
            'ROMANEIOS_LOCAL'        : movimento.get('EMPRESAS_ID_CIDADES') == movimento.get('PESSOAS_ID_CIDADES') ? 'U' : 'S',
            'ROMANEIOS_TOTAL'        : movimento.get('MOVIMENTOS_IMPOSTO'),
            'ROMANEIOS_OBSERVACOES'  : tipo ==  'Entrega' ? 'CLIENTE RETIROU||||||||||' : '||||||||||',
            'ROMANEIOS_ITENS'        : [{
                'ROMANEIOSITENS_ID'           :            -1,
                'ROMANEIOSITENS_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'),
                'MOVIMENTOS_NUMERO'           : movimento.get('MOVIMENTOS_NUMERO'),
                'MOVIMENTOS_SERIE'            : movimento.get('MOVIMENTOS_SERIE'),
                'MOVIMENTOS_EMISSAO'          : movimento.get('MOVIMENTOS_EMISSAO'),
                'MOVIMENTOS_ID_PESSOAS'       : movimento.get('MOVIMENTOS_ID_PESSOAS'),
                'PESSOAS_CPFCNPJ'             : movimento.get('MOVIMENTOS_CPFCNPJ'),
                'PESSOAS_ENDERECO'            : movimento.get('PESSOAS_ENDERECO'),
                'PESSOAS_NUMERO'              : movimento.get('PESSOAS_NUMERO'),
                'PESSOAS_BAIRRO'              : movimento.get('PESSOAS_BAIRRO'),
                'CIDADES_NOME'                : movimento.get('CIDADES_NOME'),
                'CIDADES_ESTADO'              : movimento.get('CIDADES_ESTADO'),
                'MOVIMENTOS_ID_USUARIOS'      : movimento.get('MOVIMENTOS_ID_USUARIOS'),
                'USUARIOS_NOME'               : movimento.get('USUARIOS_NOME'),
                'MOVIMENTOS_ENTRADASAIDA'     : movimento.get('MOVIMENTOS_ENTRADASAIDA'),             'MOVIMENTOS_NOME':              movimento.get('MOVIMENTOS_NOME'),
                'MOVIMENTOS_IMPOSTO'          : movimento.get('MOVIMENTOS_IMPOSTO'),
                'ROMANEIOSITENS_ID_ITEM'      : 1,
                'ROMANEIOSITENS_QUANTIDADE'   : 1,
                'MONTAGENS_VALOR'             : movimento.get('MONTAGENS_VALOR')
            }]
        });

        const formRomaneio = Ext.create({
            xtype: 'formromaneiosmoveis',
            listName: 'Romaneio ' + tipo,
            listView: listRomaneio,
            permissoes: listRomaneio.getPermissoes(),
            model: romaneio
        });
        
        const formRomaneioController = formRomaneio.getController();

        tabpanel.add(formRomaneio);

        formRomaneio.getViewModel().set({
            'readOnly':       false,
            'initialValues':  {},
            'previousModel':  undefined,
            'editionClosed':  true,
            'model':          romaneio,
            'listName':       'Romaneio ' + tipo
        });

        tabpanel.setActiveTab(formRomaneio);
        tabpanel.disableOtherTabs();
        formRomaneioController.doDefaultFocus();
        await RomaneioMoveis.services.Model.definirValoresPadrao(formRomaneio, 'Romaneio ' + tipo);
    }
});
