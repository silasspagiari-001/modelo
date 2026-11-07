Ext.define('SamosAdmin.movimentos.movimento.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formmovimentos',

    mixins: {
        cartoes:  'SamosAdmin.movimentos.movimento.form.caixa.cartoes.Mixin',
        produtos: 'SamosAdmin.movimentos.movimento.form.mixins.Produtos',
        status:   'SamosAdmin.movimentos.movimento.form.mixins.Status'
    },

    onAfterConstructor: async function(){
       const view = this.getView ? this.getView() : [],
             model = view.model ? view.model : []; //null

       if( configs.getClientName() == 'prudenaco' ){
           view.lookupReference('subst').setFieldLabel('Restante');

           //Remove o binding dele pois é apenas pra consulta
           view.lookupReference('subst').setBind({value: '{bidingNulo}'});
           view.lookupReference('subst').setBind({readOnly: '{readOnlyNulo}'});
       }

       //Se for pedido ou nota eletronica
       if( view.listName == 'Nota Eletrônica' || view.listName == 'Pedidos'){
            const geraFinanceiro = model.get('OPERACOES_FINANCEIRO') != 'N';
            const isCancelado = (model.get('MOVIMENTOS_STATUS') == 'C' || // Cancelada
                                 model.get('MOVIMENTOS_STATUS') == 'D' || // Denegada 
                                 model.get('MOVIMENTOS_STATUS') == 'R' || // Recusada
                                 model.get('MOVIMENTOS_STATUS') == 'U' || // Inutilizada                                 
                                 model.get('MOVIMENTOS_STATUS') == 'V');  // Devolvida
            const caixaMovimento = model.get('MOVIMENTOS_CAIXA')[0] || {};
            const totalMovimento = cents(model.get('MOVIMENTOS_TOTAL')) - cents(model.get('MOVIMENTOS_VALORRETENCAO'));
            const totalCaixaMovimento = cents(caixaMovimento['MOVIMENTOSCAIXA_DINHEIRO']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_CHEQUE']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_CREDITO']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_DEBITO']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_DUPLICATA']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_TRANSFERENCIAS']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_OUTRO']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_COMBUSTIVEL']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_PRESENTE']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_REFEICAO']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_ALIMENTACAO']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_CREDITOPESSOA']) + 
                                        cents(caixaMovimento['MOVIMENTOSCAIXA_CREDITOLOJA']);

            if( model.get('EMPRESAS_CAIXA') != 'T' && geraFinanceiro && !isCancelado && !model.isNew() && totalMovimento != totalCaixaMovimento ){
                model.set({
                    'MOVIMENTOS_STATUS': 'N'
                });
                Ext.Note('warning', 'Caixa divergente! (' + totalCaixaMovimento.toString() + ') Altere o pagamento ou o movimento.', 3000);
            }
       }

       if(configs.getClientName() == 'prudenmoveis' && 
          view.listName == 'Orçamentos' &&
          model.isNew()) {
            this.onPessoasEditClick();
       }

    },

    onSairCampoOperacoes: async function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model');

        if(vm.get('isNotaEntrada') || (vm.get('isNotaEletronica') && configs.getClientName() == 'malacrida')) {
            const movimento = this.getRecord();
            const produtos = this.lookup('produtos').getStore().getData().items || [];
    
            if(movimento.get('OPERACOES_UNICA') == 'T' &&
               movimento.get('MOVIMENTOS_ID_OPERACOES') != '100000' &&  // Acertos de estoque
               movimento.get('MOVIMENTOS_ID_OPERACOES') != '200000'     // Nunca mudam          
               ) {
                const produtosAtualizados = produtos.map(produto => {
                    produto.set('MOVIMENTOSITENS_ID_OPERACOES', movimento.get('MOVIMENTOS_ID_OPERACOES'));
                    produto.set('OPERACOES_NOME', movimento.get('OPERACOES_NOME'));
                    return produto.data;
                });

                movimento.set('MOVIMENTOS_ITENS', produtosAtualizados);
            }

        }

    },

    //FUNÇÂO COM FALHA NA HORA DE FECHAR
    onSairCampoPrazos: async function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model');

        Ext.defer( async()=>{
            const dadosPrazos = await SamosUtils.ConsultasGenerica.consultaAtualizaModel(campo.getValue(), 'prazos');

            model.set({
                'MOVIMENTOS_ID_PRAZOS'  : dadosPrazos['PRAZOS_ID'],
                'PRAZOS_NOME'           : dadosPrazos['PRAZOS_NOME'],
                'PRAZOS_PARCELAS'       : dadosPrazos['PRAZOS_PARCELAS'],
                'PRAZOS_PARCELAMENTO'   : dadosPrazos['PRAZOS_PARCELAMENTO']
            });


        }, 100, this );
    },

    onSairCampoPessoas: async function(campo, evento){
        const vm = this.getViewModel(),
              model = vm.get('model');

        Ext.defer( async()=>{
            const dadosPessoa = await SamosUtils.ConsultasGenerica.consultaAtualizaModel(campo.getValue(), 'pessoas');
            
            model.set({
                'MOVIMENTOS_ID_PESSOAS'    : dadosPessoa['PESSOAS_ID'],
                'MOVIMENTOS_NOME'          : dadosPessoa['PESSOAS_NOME'],
                'MOVIMENTOS_CPFCNPJ'       : dadosPessoa['PESSOAS_CPFCNPJ'],
                'MOVIMENTOS_CELULAR'       : dadosPessoa['PESSOAS_CELULAR'],
                'MOVIMENTOS_EMAIL'         : dadosPessoa['PESSOAS_EMAIL'],
                'PESSOAS_ENDERECO'         : dadosPessoa['PESSOAS_ENDERECO'],
                'CIDADES_NOME'             : dadosPessoa['CIDADES_NOME'],
                'CIDADES_ESTADO'           : dadosPessoa['CIDADES_ESTADO'],
                'PESSOAS_TIPO'             : dadosPessoa['PESSOAS_TIPO'],
                'CONSUMIDOR_CIDADESID'     : dadosPessoa['PESSOAS_ID_CIDADES'],
                'CONSUMIDOR_CIDADESNOME'   : dadosPessoa['CIDADES_NOME'],
                'CONSUMIDOR_CIDADESESTADO' : dadosPessoa['CIDADES_ESTADO'],
                'PESSOAS_CPFCNPJ'          : dadosPessoa['PESSOAS_CPFCNPJ'],
                'PESSOAS_FANTASIA'         : dadosPessoa['PESSOAS_FANTASIA'],
                'PESSOAS_TELEFONE'         : dadosPessoa['PESSOAS_TELEFONE'],
                'PESSOAS_NUMERO'           : dadosPessoa['PESSOAS_NUMERO'],
                'PESSOAS_BAIRRO'           : dadosPessoa['PESSOAS_BAIRRO'],
                'PESSOAS_CEP'              : dadosPessoa['PESSOAS_CEP'],
                'PESSOAS_ID_CIDADES'       : dadosPessoa['PESSOAS_ID_CIDADES'],
                'PESSOAS_CREDITO'          : dadosPessoa['PESSOAS_CREDITO'],
                'PESSOAS_STATUS'           : dadosPessoa['PESSOAS_STATUS'],
                'PESSOAS_INSCRICAO'        : dadosPessoa['PESSOAS_INSCRICAO']
            });

        }, 100, this );
    },

    onUpdateField: function (txt) {
        txt.getEl().dom.onkeyup = event => {
            if(
                SamosUtils.Events.isEnter(event) ||
                SamosUtils.Events.isTab(event)
            ) { return; }

            try {
                this.atualizarCalculos(txt, event);
            } catch(error) {
                console.error(error);
            }
        }
    },
   
    atualizarCalculos: async function(txt, event) {
        try {
            this.iniciarEdicao();

            //verifica se a alteração foi disparada no cabecalho ou na grid de itens
            const alteracaoCabecalho = !txt.fromGridItems;

            //caso a alteracao tenha sido feita em um item
            //pega os valores dos campos da linha alterada e coloca na variavel "produto"
            const formProduto = alteracaoCabecalho ? null : txt.up('form').getForm();

            //pega o nome do campo alterado (se for do cabecalho pega do bind)
            const fieldName = alteracaoCabecalho ? txt.bind.value.stub.name : txt.name

            //pega o movimento e os produtos
            //que são as referencias confiáveis usadas nos calculos
            const movimento = this.getRecord();

            const result = Movimento.calculos.RecalculoSync.calcular({
                produto   : formProduto ? formProduto.getValues() : null,
                movimento : Object.assign({}, movimento.data),//não envia o model apenas os valores
                event     : event ? event.type : null,
                fieldName : fieldName
            });

            this.efetivarCalculos(result, formProduto, alteracaoCabecalho);

            if(result.mensagem) {
                Ext.Note('warning', result.mensagem);
                txt.focus(true);
            }

            if(result.senhaNivel  && !configs.getMovimentos().desativaSenha) {
                const options = {
                    produto   : formProduto ? formProduto.getValues() : null,
                    movimento : Object.assign({}, movimento.data),
                    event     : null,
                    fieldName : fieldName
                };

                try {
                    await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(result.senhaNivel.nivel);
                    result.senhaNivel.autorizar(options);
                } catch(error) {
                    result.senhaNivel.rejeitar(options);
                }

                const resultAtualizado = Movimento.calculos.RecalculoSync.calcular(options);

                this.efetivarCalculos(resultAtualizado, formProduto, alteracaoCabecalho);
            }

        } catch(error) {
            console.error(`[atualizarCalculos] Erro`)
            console.error(error);
        }
    },

    efetivarCalculos: function(result, formProduto, alteracaoCabecalho) {
        const movimento = this.getRecord();

        //atualiza o model, que é sempre a referencia mais confiável
        movimento.set(result.movimento);

        //se a alteração foi feita em um campo do cabecalho
        if(alteracaoCabecalho) {
            //aguarda o usuário ficar mais de 2s sem digitar (para evitar delays durante a digitação)
            clearTimeout(this.loadItemsTimeout || 0);
            this.loadItemsTimeout = setTimeout(() => {
                this.loadItemsTimeout = 0;
                //atualiza toda a grid de itens com os novos valores calculados
                this.lookup('produtos').carregar(result.movimento['MOVIMENTOS_ITENS']);
            }, 2000);

        //se um produto foi apagado
        } else if(result.produto && result.produto['MOVIMENTOSITENS_ID_PRODUTOS'] == '') {
            //atualiza toda a grid de itens com os novos valores calculados
            this.lookup('produtos').carregar(result.movimento['MOVIMENTOS_ITENS']);
        } else {
            //se a alteração foi feita diretamente no item
            //atualiza os campos apenas para visualizacao
            if(result.produto && result.produto['MOVIMENTOSITENS_ID_PRODUTOS'] != '') {
                formProduto.setValues(result.produto);
            } else {
                formProduto.reset();
            }
        }
    },

    onNovoClick: async function () {
        const view = this.getView();

        try {
            const nomeDocumento = this.getListView().title;
//          const isUDM = SamosUtils.String.isUltimoDiaUtilDoMes() || false;

//          console.log('isUDM: ', isUDM);            

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
                    SamosUtils.Msg.alert('Lembrete', `Há notas a serem enviadas!<br><h5>${nfPendentes}<h5>`, 4000);
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

                if(nomeDocumento.match(/Nota Eletrônica/i)) {

                    let nfForaSequencia = '';

                    if((configs.getEmpresa().ambiente || '') != 'H') { // Em homologação não checa
                        if(configs.getClientName() == 'prudenmoveis' && 
                        (configs.getEmpresa().id == 2 || configs.getEmpresa().id == 9)) {
                            // FT e RB compartilham sequencia, então não faz essa checagem
                        } else {
                            nfForaSequencia = await Movimento.services.Documento.verificarSequenciaNF();
                        }
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

                view.stopGauge();
            }

/*            if(nomeDocumento.match(/Nota Eletrônica/) && isUDM) {
                
                view.initGauge();

                const nfPendentes = await Movimento.services.Documento.verificarNFPendentes({ 
                    meses     : 1,
                    incluiHoje: 'T'
                });

                if(nfPendentes) {
                    view.stopGauge();
                    SamosUtils.Msg.alert('Lembrete', `Há notas a serem enviadas antes!<br><h5>${nfPendentes}<h5>Envie elas primeiro ou contate o suporte`, 4000);
                    return; 
                }

                view.stopGauge();
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
                
            this.getViewModel().set({
                'boletoImpresso' : false,
                'entregaValida': false,
                'reservaValida': false,  
                'markupAtivo': false,
                'custoAtivo' : false
            });

            await this.callParent(arguments);

            if(nomeDocumento.match(/Nota Eletrônica/i)) {
                await Movimento.services.Model.definirValoresPadrao(view, nomeDocumento, proximaNfe);
            } else {
                await Movimento.services.Model.definirValoresPadrao(view, nomeDocumento);
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

        this.lookup('pessoa').focus(true);        

        return view;
    },

    onAlterarClick: function (btn, event) {
        const form = this.getView();
        const model = this.getRecord();
        const vm = this.getViewModel();
        const isNotaEntrada = vm.get('isNotaEntrada');
        const isPedido = vm.get('isPedido');

        const titulos = model.get('MOVIMENTOS_FINANCEIROS');
        const isFaturado = model.get('MOVIMENTOS_STATUS') == 'F';

        if((configs.getClientName() == 'pinguim' && isPedido && !configs.getUsuario().privilegiado) || 
           (configs.getClientName() == 'racaforte' && isFaturado)){
        } else {
            if(configs.getClientName() != 'acomtf' || isNotaEntrada){
                this.permiteAlteracao = true;
            }
        }

        if(!this.permiteAlteracao) {
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteAlteracao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onAlterarClick();
                })
                .catch(() => {/*acao ao sair*/});
        } else  {
            const id      = model.get('MOVIMENTOS_ID');
            const numero  = model.get('MOVIMENTOS_NUMERO');
            const serie   = model.get('MOVIMENTOS_SERIE');
            const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');

            model.getProxy().setExtraParam('log', `PUT /movimentos/${id} (${numero}|${serie}|${empresa})`);
            Movimento.services.Model.bloquearParaEdicao(model, form);
            Movimento.services.Descontos.atualizarControlesDesconto(model, form);
            this.callParent(arguments);
            delete this.permiteAlteracao;
        }

        if(!isNotaEntrada) {
            if (titulos && titulos.some(titulo => titulo['FINANCEIROS_NOSSONUMERO'] != 0)) {
                vm.set('boletoImpresso', true);
                Ext.Note('warning', 'Os boletos já foram impressos!<br><h5>Só é permitida a alteração de alguns campos<h5>', 4000)
            } else if (titulos && titulos.some(titulo => cents(titulo['FINANCEIROS_ABERTO']) != cents(titulo['FINANCEIROS_ORIGINAL']))) {
                vm.set('boletoImpresso', true);
                Ext.Note('warning', 'Há títulos com baixas/ocorrências!<br><h5>Só é permitida a alteração de alguns campos<h5>', 4000)
            }
        }
    },

    cancelar: function() {
        const vm = this.getViewModel();
        const model = this.getRecord();
        const previousModel = this.getViewModel().get('previousModel');
        const isNotaEntrada = this.getViewModel().get('isNotaEntrada');

        SamosUtils.Events.disableWarnReload();
        
        if (previousModel || (model && model.isNew && !model.isNew())) {
            if(previousModel) {
                try {
                    vm.set('model', previousModel);
                } catch (error) {
                    this.onSairClick();
                    return
                }
            } else {
                if(!isNotaEntrada){
                    Movimento.services.Model.liberarParaEdicao(model, this.getView());
                }

                try {
                    model.set(vm.get('initialValues'));
                } catch (error) {
                    this.onSairClick();
                    return
                }
            }

            this.finalizarEdicao();
            this.setReadOnly(true);
            setTimeout(() => {
                this.lookup('sair').getEl().focus();
            }, 200);
            
        } else {
            this.onSairClick();
        }
    },

    onExcluirClick: function (btn, event) {
        const model = this.getRecord();
        const romaneios = model.get('ROMANEIOS_MOVEIS') || [];

        if(
            configs.getMovimentos().ramoRomaneio == 'moveis' &&
            this.getView().title == 'Pedido' &&
            romaneios.length > 0
        ){
            Ext.Note('warning', 'Este movimento está em romaneio');
        } else if((model.get('EMPRESAS_FANTASIA') || '').toUpperCase().match(/TURBOTEC/) &&
                   model.get('MOVIMENTOS_NUMEROORIGEM') > 0 && 
                   model.get('MOVIMENTOS_SERIEORIGEM') == 'OS'
        ){
            Ext.Note('warning', 'Este movimento está vinculado a uma OS');
        } else if(!this.permiteExclusao && (!configs.getUsuario().privilegiado || configs.getClientName() == 'acomtf')){
            const nivel = 1;

            Ext.create({ xtype: 'samoswidgets-senhanivel' })
                .iniciar(nivel)
                .then(() => {
                    this.permiteExclusao = true;
                    model.getProxy().setExtraParam('senhaNivel', 'true');
                    this.onExcluirClick();
                })
                .catch(() => {/*acao ao sair*/});

        } else {
            delete this.permiteExclusao;

            const id      = model.get('MOVIMENTOS_ID');
            const numero  = model.get('MOVIMENTOS_NUMERO');
            const serie   = model.get('MOVIMENTOS_SERIE');
            const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');

            Ext.Msg.confirmDelete(btn => {
                if (btn == 'yes') {
                    this.getView().initGauge('Excluindo...');
                    this.colocarFilhosNoModel(model);

                    model.getProxy().setExtraParam('log', `DELETE /movimentos/${id} (${numero}|${serie}|${empresa})`);
                    model.getProxy().setExtraParam('empresa', model.get('MOVIMENTOS_ID_EMPRESAS'));
                    model.getProxy().setExtraParam('idsProdutos', model.get('MOVIMENTOS_ITENS').reduce((str, item) => {
                        return str += item['MOVIMENTOSITENS_ID_PRODUTOS'] + ',';
                    }, ''));
    
                    model.erase()
                        .then(() => {
                            this.getView().stopGauge();
                            this.getListView().down('grid').getStore().load();
                            Ext.Note('success', 'Registro excluído');
                            setTimeout(() => {
                                this.onSairClick();
                                this.getListView().down('toolbar').focus(true);
                            }, 500);
                        })
                        .catch(() => Ext.Note('error', 'Erro no servidor'))
                        .finally(() => this.getView().stopGauge())
                }
            });
        }
    },

    onGravarClick: async function (btn, event) {
        const view = this.getView();
        const btnOpcoes = view.down('button[text="Opções"]');

        try {
            const movimento           = this.getRecord();
            const vm                  = this.getViewModel();
            const idDocumento         = movimento.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-2);
            const idVendedor          = movimento.get('MOVIMENTOS_ID_USUARIOS');
            const classePessoa        = movimento.get('CLASSE_CADASTRO') || 'A';
            const idOperacao          = movimento.get('MOVIMENTOS_ID_OPERACOES').toString().slice(0, 3);
            const idCodctb            = cents(movimento.get('MOVIMENTOS_ID_CUSTOS'));
            const formaPagto          = cents(movimento.get('MOVIMENTOS_ID_APLICACOES')) / 100;
            const codSituacao         = movimento.get('MOVIMENTOS_SITUACAO').toString();
            const descMovimento       = grams(movimento.get('MOVIMENTOS_PERCENTUAL')); // Desconto em %
            const tipoLiberado        = (movimento.get('MOVIMENTOS_SITUACAO') || '').toString().match(/A|B|C|D|E|F|G/);
            const tipoLiberadoExterno = (movimento.get('MOVIMENTOS_SITUACAO') || '').toString().match(/I/);
            let abaixoLimiteEntrega   = '';

            // Requisição de acerto
            if(configs.getClientName() == 'hospitalar' && 
               idDocumento == '04' && 
               codSituacao != '3' && (idOperacao == '100' || idOperacao == '200')){
                Ext.Note('warning', 'Requisição de acerto, não permitido atualizar pagar/custo');
                return;                    
            }

            // Bloqueio raçaforte classe cliente
            if(configs.getClientName() == 'racaforte' && classePessoa == 'D'){
                Ext.Note('warning', 'Pessoa Classe D - Não permitido');
                return;                    
            }

            if(configs.getClientName() == 'racaforte' && (idDocumento == '03' || idDocumento == '05')){  // Nota de entrada/Saida
                if(idCodctb <= 100) {
                    Ext.Note('warning', 'Informe o Histórico Contábil');
                    return;                        
                }
            }

            if(idDocumento == '05') { // Nota de entrada checa CNPJ da Chave
                if(movimento.get('MOVIMENTOS_NFE') != '') {
                    if(SamosUtils.String.onlyNumbers(movimento.get('PESSOAS_CPFCNPJ')) != movimento.get('MOVIMENTOS_NFE').slice(6, 20)) {
                        Ext.Note('warning', 'CNPJ da Chave da NF Entrada não bate com o CNPJ do fornecedor informado - Selecione o fornecedor correto');
                        return;
                    }
                }
            }

            if(configs.getClientName() == 'racaforte' && classePessoa == 'E'){
                if(!codSituacao.match(/B|C|D|E/)) {
                    Ext.Note('warning', 'Permitido Somente em Dinheiro/Cartão/Pix');
                    return;                        
                }
            }

            if(vm.get('isSaidaRacaforte')) {
                if((idVendedor == 8 || idVendedor == 11) && vm.get('isOrcamento')) { // Exclusivo vendedores raçaforte
                    if(!tipoLiberadoExterno) {
                        Ext.Note('warning', 'Só é permitido o tipo VALE VENDEDOR');
                        return;
                    }        
                } else {
                    if(!tipoLiberado) {
                        Ext.Note('warning', 'Informe um tipo de pagamento permitido');
                        return;
                    }        
                }
            }

            if(vm.get('isOrcamentoRacaforte') && cents(movimento.get('MOVIMENTOS_ID_DOCUMENTOS') == 0)) {
                Ext.Note('warning', 'Informe o tipo de Documento');
                return;
            }

            if( configs.getClientName() == 'hospitalar' && idDocumento == '02'){
                if( (await this.verificarDocumentosVencidos( movimento )) != false ){
                    //Percorrer a grid e ver se tem algum medicamento
                    let temMedicamento = false;
                    movimento.get('MOVIMENTOS_ITENS').forEach( (produtoAtual)=>{
                        if( produtoAtual['PRODUTOS_DERIVADO'] == 'M' ){
                            temMedicamento = true;
                        }
                    });

                    if( temMedicamento ){
                        Ext.Note('warning', 'Pessoa com documentos vencidos - não permitido vender medicamentos no movimento.');
                        return;
                    }
                }
            }

            if(configs.getClientName() == 'turbotec' && idDocumento.match(/02|03/)){  // Controle casco PED/NFS turbotec
                //Percorrer a grid e ver se tem algum produto sem info casco
                let listaCascos = '';
                movimento.get('MOVIMENTOS_ITENS').forEach(produtoCasco => {
                    if((produtoCasco['PRODUTOS_ID_GRUPOS'] == 1 || 
                        produtoCasco['PRODUTOS_ID_GRUPOS'] == 10) &&
                        produtoCasco['MOVIMENTOSITENS_ESCRITURACAO'] == '0'){
                        listaCascos += produtoCasco['MOVIMENTOSITENS_ID_PRODUTOS'].toString() + ', ';
                    }
                });

                if( listaCascos ){
                    Ext.Note('warning', 'Informe se o(s) item(ns): ' + listaCascos + 'devem o casco');
                    return;
                }
            }

            if( configs.getClientName() == 'prudenmoveis' && (idDocumento == '01' || idDocumento == '02')){

                const montagemAbatida = movimento.get('MOVIMENTOS_NFE') == 'ABA';
                const itensConferir = this.lookup('produtos').getStore().getData().items || [];
                let comPrecoAbaixo = '';

                itensConferir.forEach( (produtoAtual)=>{
                    let precoPermitido = formaPagto == 617 ? cents(produtoAtual.get('VALOR_PROMOCAO') || produtoAtual.get('SALDOS_PRECO')) : 
                                                             cents(produtoAtual.get('VALOR_PROMOCAOB') || produtoAtual.get('SALDOS_PRECO'));
                    if(montagemAbatida) { // Cliente optou por cuidar da montagem
                        precoPermitido = precoPermitido - cents(produtoAtual.get('MONTAGENS_VALOR'));
                    }

                    if( cents(produtoAtual.get('VALOR_LIQUIDO')) < precoPermitido){
                        comPrecoAbaixo += produtoAtual.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
                    }
                });

                if(comPrecoAbaixo){
                    Ext.Note('warning', 'Produto(s): ' + comPrecoAbaixo + ' com preço Abaixo do Permitido');
                    return;
                }
            }

            if(configs.getClientName() == 'hermes' && 
               idDocumento == '02' &&
               descMovimento > 30000) { // 30% de desconto
                try {
                    await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(1);
                } catch(error) {
                    Ext.Note('warning', 'Desconto não autorizado');
                    return;
                }        
            }
            
            if( configs.getClientName() == 'prudenmoveis' && 
                !this.validarPessoaPrudenmoveis() ) {
                throw 'Tipo ou Código inválido - Corrigir Código Pessoa';
            }

            if(configs.getClientName() == 'prudenmoveis') {
                abaixoLimiteEntrega = await this.checarEntregaPrudenmoveis();
            } 

            if(configs.getClientName() == 'prudenmoveis' && parseInt(idDocumento) < 3) { // Orçamentos e pedidos
                hasDuplicados = await this.temDuplicados(this.lookup('produtos').getStore().getData().items || []);
                if(hasDuplicados) {
                    return;
                }
            }    
                
            if(abaixoLimiteEntrega == 'A') {
                if(await SamosUtils.Msg.confirm('Cliente deverá retirar produtos - Confirma?')) { 
                    movimento.set('MOVIMENTOS_FRETE', 0);
                    Ext.defer(this.onFecharClick, 200, this);                    
                 } else {
                    return ;
                }
            }
            
            if(
                configs.getClientName() == 'acomtf' && 
                !this.validarPessoaAcomtf()
            ) {
                throw 'Tipo ou Código inválido - Corrigir Código Pessoa';
            }

            if(configs.getClientName() == 'prudenmoveis' && 
               vm.get('isOrcamento') && 
               vm.get('isConsumidorPrudenMoveis') &&
               cents(movimento.get('MOVIMENTOS_ID_CUSTOS')) == 0) {
                throw 'Informe se Entrega é Urbana ou Suburbana';
            }

            if(configs.getClientName() == 'prudenmoveis' && (vm.get('isPedido') || vm.get('isOrcamento'))) {
                const freteDigitado = cents(movimento.get('MOVIMENTOS_FRETE'));
                const fretePadrao =  movimento.get('MOVIMENTOS_ID_CUSTOS') == '1' ?
                                     cents((movimento.get('EMPRESAS_CNAE')||'').split('|')[0]) : // Urb
                                     cents((movimento.get('EMPRESAS_CNAE')||'').split('|')[1])   // Sub

                const isSuburbano = ((movimento.get('PESSOAS_ID_CIDADES') != movimento.get('EMPRESAS_ID_CIDADES')) || 
                                     (vm.get('isConsumidorPrudenMoveis') && movimento.get('MOVIMENTOS_ID_CUSTOS') == 2));
                const valorMovimento = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_FRETE'));
                const minimoUrb = cents(movimento.get('EMPRESAS_CNAE').split('|')[3]);
                const minimoSub = cents(movimento.get('EMPRESAS_CNAE').split('|')[4]);                             
                                     

                if((isSuburbano && valorMovimento >= minimoSub) ||
                   (!isSuburbano && valorMovimento >= minimoUrb)) {
                    if(freteDigitado != fretePadrao) {
                        Ext.Note('warning', 'Valor de frete fora do padrão: (' + (fretePadrao/100) + ') ');
                        try {
                            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(3); 
                        } catch(error) { 
                            Ext.Note('warning', 'Valor de frete não autorizado');
                            return;   
                        }
                    }
                }
            }

            if(
                configs.getClientName() == 'herbiquimica' && 
                !this.validarPropriedadeMovimento()
            ) {
                throw 'Propriedade não pertence à pessoa - Corrigir';
            }

            if(configs.getClientName() == 'prudenaco' &&
                this.getViewModel().get('isNotaEletronica')) {
                const form = Ext.$('formmovimentos')[0] || [];
                const itensMovimento = form.down('samoswidgets-griditems').getStore().getData().items || [];        
                if(itensMovimento.some(item => {
                    return item.get('PRODUTOS_STATUS') == 'N'}, 0)) {
                    throw 'Há itens não NF - Corrigir';
                }    
            }

            if(configs.getClientName() == 'malacrida' && 
               this.getViewModel().get('isPedido')) {
                if(this.getViewModel().get('model.MOVIMENTOS_ID_OPERACOES') == 500000 ||
                   this.getViewModel().get('model.MOVIMENTOS_ID_OPERACOES') == 510000) {
                } else {
                        throw 'Operação não permitida - use 500000 ou 510000';
                }
            } 

            if(configs.getMovimentos().senhaSaldoInsuficiente &&
                this.getViewModel().get('model.OPERACOES_ESTOQUE') == 'D') {
                const form = Ext.$('formmovimentos')[0] || [];
                let listaInsuficientes = '';
                const itensParaSaldo = form.down('samoswidgets-griditems').getStore().getData().items || []; 

                for (let itemSld of itensParaSaldo) {
                    let saldoBase = 0;
                    saldoBase = grams(itemSld.get('SALDOS_DISPONIVEL'));
                    if(grams(itemSld.get('MOVIMENTOSITENS_QUANTIDADE')) > saldoBase) {                        
                        listaInsuficientes += itemSld.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
                    }
                }
                    
                if((listaInsuficientes || '').length > 0) {
                   Ext.Note('warning', 'Produtos com saldo insuficiente: ' + listaInsuficientes);
                   try {
                        await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(1); 
                   } catch(error) { 
                        Ext.Note('warning', 'Produtos sem saldo não autorizados');
                        return;   
                   }
                }                
            }

            await this.validarCabecalho();

            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                view.initGauge('Gravando...');

                if(movimento.isNew()) {
                    movimento.set('COMANDA_NUMERO', configs.getMovimentos().usaComanda ? await this.obterNumeroComanda() : '');
                }
    
                let status = movimento.get('MOVIMENTOS_STATUS');
    
                if(status == 'B'){//cancelado em uso
                    status = 'C';
                } else if(status == 'M'){//nao faturado em uso
                    status = 'N';
                } else if(status == 'E'){//faturado em uso
                    status = 'F';
                }
    
                if(
                    vm.get('isRequisicao') && 
                    status == 'N' && 
                    (configs.getEmpresa().cnpj.substring(0, 8) != '04395395' && 
                     configs.getEmpresa().cnpj.substring(0, 8) != '00123727' &&  
                     configs.getEmpresa().cnpj.substring(0, 8) != '45118377')     // Margarida/Herbiquimica/Eduardo
                ) {
                    status = 'F';
                }
    
                movimento.set('MOVIMENTOS_STATUS', status);
                vm.set('comLoteLiberado', false);
                vm.set('comSaldoLiberado', false);

                this.colocarFilhosNoModel(movimento);
    
                if(
                    vm.get('isNotaEletronica') && 
                    configs.getMovimentos().exibirPedidoCompraNfe &&
                    movimento.get('PEDIDO_NUMERO')
                ) {
                    const obsOriginal = movimento.get('MOVIMENTOS_OBSERVACOES').split('|');
                    const obsNova = obsOriginal.slice(0, 10).join('|') + '|COMPRA=' + movimento.get('PEDIDO_NUMERO') + '|ITEM=' + movimento.get('PEDIDO_ITEM');
                    movimento.set('MOVIMENTOS_OBSERVACOES', obsNova);
                }
    
                (movimento.data['MOVIMENTOS_FINANCEIROS'] || []).forEach(titulo => {
                    titulo['FINANCEIROS_ID_EMPRESAORIGEM'] = titulo['FINANCEIROS_ID_EMPRESAORIGEM']  || 0;
                    titulo['FINANCEIROS_NUMEROORIGEM']     = titulo['FINANCEIROS_NUMEROORIGEM']      || 0;
                    titulo['FINANCEIROS_SERIEORIGEM']      = titulo['FINANCEIROS_SERIEORIGEM']       || 0;
                    titulo['FINANCEIROS_BOLETO']           = titulo['FINANCEIROS_BOLETO']            || '';
    
                    if (
                        titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira && 
                        titulo['FINANCEIROS_ID_PESSOAS'] != '999999'
                    ){
                        titulo['FINANCEIROS_ID_PESSOAS'] = movimento.get('MOVIMENTOS_ID_PESSOAS');
                    }
                });
    
                (movimento.data['MOVIMENTOS_CAIXA'] || []).forEach(caixa => {
                    caixa['MOVIMENTOSCAIXA_ID_PESSOAS'] = movimento.get('MOVIMENTOS_ID_PESSOAS');
                });
                
                movimento.set('USUARIOS_LOGIN', configs.getUsuario().login);
                movimento.set('MOVIMENTOS_ITENSANTIGOS', vm.get('initialValues')['MOVIMENTOS_ITENS']);
    
                if(
                    vm.get('isNotaEntrada') && 
                    configs.getClientName() != 'prudenmoveis' && 
                    movimento.get('MOVIMENTOS_NUMEROORIGEM') &&
                    movimento.get('MOVIMENTOS_SERIEORIGEM')
                ) {
                    await SamosUtils.Request.nodeApi({
                        url: `/processos/movimentos/faturarpedidocompra`,
                        method: 'POST',
                        data: {
                            'MOVIMENTOS_NUMERO'          : movimento.get('MOVIMENTOS_NUMEROORIGEM'),
                            'MOVIMENTOS_SERIE'           : movimento.get('MOVIMENTOS_SERIEORIGEM'),
                            'MOVIMENTOS_ID_EMPRESAS'     : movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                            'MOVIMENTOS_ID_EMPRESAORIGEM': movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                            'MOVIMENTOS_NUMEROORIGEM'    : movimento.get('MOVIMENTOS_NUMERO'),
                            'MOVIMENTOS_SERIEORIGEM'     : movimento.get('MOVIMENTOS_SERIE')
                        }
                    });
                }

                const caixa = (movimento.get('MOVIMENTOS_CAIXA') || [])[0] || {};
                // Depósito/Transfer/Etc.
                if(
                    !configs.getEmpresa().regimeCaixa && 
                    caixa['MOVIMENTOSCAIXA_TRANSFERENCIAS'] > 0
                ) {
                    await SamosUtils.Request.nodeApi({
                        url: `/deposito`,
                        method: 'POST',
                        data: {
                            portador  : caixa['MOVIMENTOSCAIXA_ID_PORTADORES'],
                            aplicacao : caixa['MOVIMENTOSCAIXA_ID_APLICACOES'],
                            status    : 'T',
                            pessoa    : movimento.get('MOVIMENTOS_ID_PESSOAS'),
                            documento : caixa['MOVIMENTOSCAIXA_DOCUMENTO'] || `${movimento.get('MOVIMENTOS_NUMERO')}/${movimento.get('MOVIMENTOS_SERIE')}`,
                            valor     : caixa['MOVIMENTOSCAIXA_TRANSFERENCIAS'],
                            tipo      : caixa['MOVIMENTOSCAIXA_TIPO'],
                            emissao   : caixa['MOVIMENTOSCAIXA_EMISSAO'],
                            vencimento: caixa['MOVIMENTOSCAIXA_EMISSAO'],
                            nome      : movimento.get('MOVIMENTOS_NOME'),
                            empresa   : movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                            numero    : movimento.get('MOVIMENTOS_NUMERO'),
                            serie     : movimento.get('MOVIMENTOS_SERIE'),
                            log       : SamosUtils.Info.getLog()
                        }
                    });
                }

                const movimentoSalvo = await movimento.save();

                if( configs.getMovimentos().reservaAutomatica ){
                    view.model.set({
                        'RESERVAS_STATUS': 'T'
                    });
                }

                this.onGravacaoSucesso(movimentoSalvo);
            }

        } catch(error) {
            console.error(error)
            if(error && error.error == 'Divergência'){
                this.iniciarEdicao();
                error = 'Há divergência entre os valores do movimento. Tente novamente.';
            }

            SamosUtils.Msg.error(error, 'Falha ao gravar');
        }

        SamosUtils.Events.disableWarnReload();
        view.stopGauge();
    },
    
    onSefazClick: async function (btn, e) {

        const view = this.getView();
        const movimento = this.getRecord();
        const isExportacao = movimento.get('PESSOAS_CATEGORIA') == '3';
        const cpfcnpjmovimento = cents(movimento.get('MOVIMENTOS_ID_PROPRIEDADES')) > 0 ?
                                 SamosUtils.String.onlyNumbers(movimento.get('PROPRIEDADES_CPFCNPJ')) :
                                 SamosUtils.String.onlyNumbers(movimento.get('PESSOAS_CPFCNPJ'));
        const numEndereco  = cents(movimento.get('MOVIMENTOS_ID_PROPRIEDADES')) > 0 ? (movimento.get('PROPRIEDADES_NUMERO') || '') : (movimento.get('PESSOAS_NUMERO') || '');
        const finMovimento = movimento.get('OPERACOES_FINANCEIRO') || '';
        const caxMovimento = movimento.get('MOVIMENTOS_CAIXA') || [];
        const staMovimento = movimento.get('MOVIMENTOS_STATUS') || '';
        const inscricaomovimento = SamosUtils.String.onlyNumbers( movimento.get('PESSOAS_INSCRICAO') );
        const ufMovimento = cents(movimento.get('MOVIMENTOS_ID_PROPRIEDADES')) > 0 ? movimento.get('CIDADES_ESTADOPROPRIEDADE') : movimento.get('CIDADES_ESTADO');
        const protocoloMovimento = SamosUtils.String.onlyNumbers( movimento.get('MOVIMENTOS_PROTOCOLO') );

        if(numEndereco.length == 0 && !isExportacao) {
            SamosUtils.Msg.alert(`ERRO. Número do endereço não informado - Corrigir`);
            return;
        }

        if(cpfcnpjmovimento.length == 0) {
            SamosUtils.Msg.alert(`ERRO. Pessoa sem CPF/CNPJ Cadastrado - Corrigir`);
            return;
        }

        //Se for CNPJ e se a nota nao foi enviada

        if(finMovimento == 'R' && caxMovimento.length == 0 && staMovimento == 'N') {
            Ext.Note('warning', 'Antes de enviar, preencha o caixa');    
            this.onCaixaClick();
        } else {
            Movimento.services.Sefaz.criarJanela('movimentos', 'MOVIMENTOS');
        }
    },
    
    onCaixaClick: async function (btn, e) {
        const view = this.getView();
        const vm = this.getViewModel();
        let statusCaixa = '';

        //Obter o financeiro atualizado
        const consultaFinanceiroMovimento = await SamosUtils.Request.nodeApi({
            url: `/processos/executasql`,
            method: 'GET',
            query: {
                nomeSql: 'atualiza_financeiromovimento',
                parametroSql: vm.get('model.MOVIMENTOS_ID')     
            }
        }); 

        //Atualiza o financeiros
        if(consultaFinanceiroMovimento.results.length > 0) {
            const financeiroMovimento = consultaFinanceiroMovimento.results; 
            vm.set('model.MOVIMENTOS_FINANCEIROS', financeiroMovimento );    
        }

        try {
            const movimentoFaturado = vm.get('isFaturado');
        
            if(vm.get('formasDePagamento')) {
                Movimento.services.FormasPagamento.exibir();
        
            } else if(!movimentoFaturado) {
                if(vm.get('isSistemaAprovacao')) {                    
                    if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                        throw 'Pedido reprovado';
                    }
                }
        
                if(configs.getEmpresa().regimeCaixa) {
                    view.initGauge('Verificando caixa diário...');
        
                    const data = this.getRecord().get('MOVIMENTOS_EMISSAO');
                    statusCaixa = await Caixa.services.Model.getStatus(data);
            
                    view.stopGauge(true);    
                } else {
                    statusCaixa = 'A';
                }
        
                if(statusCaixa == 'A') {
                    Movimento.services.Caixa.criarJanelaReceber();
                } else if(statusCaixa == 'F') {
                    throw 'O caixa diário está fechado!';
                } else if(!statusCaixa) {
                    throw 'O caixa diário não foi aberto!';
                }
            } else { 
                Movimento.services.Caixa.criarJanelaReceber();
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao abrir caixa');
        }

        view.stopGauge(true);
    },

    onExportarClick: Ext.emptyFn,
    onImportarClick: Ext.emptyFn,

    onOpcoesClick: function(btn, e){
        const menuReservas = Array.from(document.querySelectorAll('.x-menu-item-text.x-menu-item-text-menu-clean-' + configs.getTema() + '.x-menu-item-indent-no-separator')).filter(item => item.innerHTML == 'Reserva')[0];
                            
        if(menuReservas){
            if(this.getRecord().get('RESERVAS_STATUS') != 'T') {
                menuReservas.parentElement.style.backgroundColor = 'yellow';
            } else {
                menuReservas.parentElement.style.backgroundColor = '';
            }
        }
    },

    onAprovadoClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
            
            if(await SamosUtils.Msg.confirm('Deseja realmente aprovar o movimento?')){
                view.initGauge(); 

                const data = { 'MOVIMENTOS_SITUACAO': 'A' };

                model.set(data);

                await SamosUtils.Request.nodeApi({
                    url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: data
                });
                
                Ext.Note('success', 'Pedido aprovado');
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao aprovar');
        }
        
        view.stopGauge();
    },

    onReprovadoClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
            
            if(await SamosUtils.Msg.confirm('Deseja realmente reprovar o movimento?')){
                view.initGauge(); 

                const data = { 'MOVIMENTOS_SITUACAO': 'R' };

                model.set(data);

                await SamosUtils.Request.nodeApi({
                    url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: data
                });
                
                Ext.Note('success', 'Pedido reprovado');
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao reprovar');
        }
        
        view.stopGauge();
    },

    onPendenteClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
            
            if(await SamosUtils.Msg.confirm('Deseja colocar o movimento como pendente?')){
                view.initGauge(); 

                const data = { 'MOVIMENTOS_SITUACAO': 'P' };

                model.set(data);

                await SamosUtils.Request.nodeApi({
                    url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: data
                });
                
                Ext.Note('success', 'Pedido pendente');
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao alterar situação');
        }
        
        view.stopGauge();
    },
    
    onPagamentoClick: function (btn, e) {
        Movimento.services.Caixa.criarJanelaPagar();
    },
    
    onDocsVinculadosClick: function (btn, e) {
        const movimento = this.getViewModel().get('model');
        const modelTransporte = Ext.create(
            'SamosAdmin.movimentos.movimento.form.transporte.Model', 
            Ext.Object.merge({ 'MOVIMENTOSENVIO_ID': -1 }, movimento.get('MOVIMENTOS_ENVIO')[0])
        );
        const viewDocsVinculados = Ext.create({
            xtype: 'formmovimentosdocsvinculados'
        });
        
        viewDocsVinculados.getViewModel().set({
            movimento: movimento,
            model: modelTransporte,
            readOnly: this.getViewModel().get('readOnly')
        });

        viewDocsVinculados.focus(true);
        this.getView().add(viewDocsVinculados);
    },
    
    onTransporteClick: function (btn, e) {
        Movimento.services.Transporte.criarJanela();
    },

    onDadosImportacaoClick: function (btn, e) {
        const movimento = this.getViewModel().get('model');
        const modelTransporte = Ext.create(
            'SamosAdmin.movimentos.movimento.form.transporte.Model', 
            Ext.Object.merge({ 'MOVIMENTOSENVIO_ID': -1 }, movimento.get('MOVIMENTOS_ENVIO')[0])
        );
        const viewDadosImportacao = Ext.create({
            xtype: 'formmovimentosdadosimportacao'
        });
        
        viewDadosImportacao.getViewModel().set({
            movimento: movimento,
            model: modelTransporte,
            readOnly: this.getViewModel().get('readOnly')
        });

        viewDadosImportacao.focus(true);
        this.getView().add(viewDadosImportacao);
    },

    onEntregaMontagemClick: function (btn, e) {
        if(configs.getMovimentos().ramoRomaneio == 'moveis'){
            Movimento.services.EntregaMoveis.criarJanela();
        } else {
            Movimento.services.EntregaConstrucao.criarJanela();
        }
    },

    onConferirClick: function() {
        const view = Ext.create({
            xtype: 'formmovimentosconferencia'
        });
        
        view.getViewModel().set({
            idMovimento: this.getRecord().get('MOVIMENTOS_ID')
        });

        const itemsConferencia = Array.from(this.getRecord().get('MOVIMENTOS_ITENS'));

        itemsConferencia.forEach(item => item['ITENS_QUANTIDADERESTANTE'] = item['MOVIMENTOSITENS_QUANTIDADE'])

        view.getViewModel().getStore('main').setData(itemsConferencia);

        this.getView().add(view);
    },

    onRecepcaoClick: function (btn, e) {
        Movimento.services.RecepcaoMoveis.criarJanela();
    },

    onReservaClick: function (btn, e) {
        Movimento.services.Reserva.criarJanela();
    },

    onCascoClick: function (btn, e) {
        Movimento.services.Casco.criarJanela();
    },

    onRomaneioClick: function (btn, e) {
        Movimento.services.Romaneio.criarJanela();
    },

    onDeOrcamentoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton'); 

        Movimento.services.ImportacaoExportacao.deOrcamento(btnImportar);
    },
    
    onDeRequisicaoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        Movimento.services.ImportacaoExportacao.deRequisicao(btnImportar);
    },
    
    onDePedidoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        Movimento.services.ImportacaoExportacao.dePedido(btnImportar);
    },

    onDePedidoCompraClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        Movimento.services.ImportacaoExportacao.dePedidoCompra(btnImportar);
    },

    onDeOrdemServicoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        Movimento.services.ImportacaoExportacao.deOrdemServico(btnImportar);
    }, 
    
    onDeXMLClick: function(itemMenu, e) {
        const movimento = this.getViewModel().get('model');

        if(configs.getMovimentos().pedidoCompraObrigatorio && cents(movimento.get('MOVIMENTOS_NUMEROORIGEM')) > 0) {
            Ext.Note('warning', 'Informe o Pedido de Compra somente após importar o XML');
        } else {
            const fileField = this.lookup('carregarxml').getEl().query('input[type="file"]')[0];

            fileField.value = '';
            fileField.click();    
        }
    },

    onCarregarXMLChange: async function(filefield) {
        await Movimento.services.ImportacaoExportacao.deXML(filefield);
        this.fazerSomasERateios();
    },

    copiarParaRecepcao: function(txt) {
        if(txt && txt.readOnly) { return true; }
        const vm = this.getViewModel();
        
        setTimeout(() => {

            let documento = vm.get('model.MOVIMENTOS_ID_DOCUMENTOS') || '';
            let emissao = vm.get('model.MOVIMENTOS_EMISSAO');

            if(configs.getClientName() == 'prudenart' && documento.toString().slice(-4) == '0005') {   // Se nota de entrada Pruden ART
              vm.set('model.MOVIMENTOS_ENTRADASAIDA', emissao);
            }
        }, 200);
    },
    
    onParaPedidoClick: async function(itemMenu, e) {
        const view = this.getView();
        const vm = this.getViewModel();
        const list = this.getListView();
        const hoje = momentServer().hours(0).minutes(0).seconds(0);
        const pessoaValida = vm.get('model.MOVIMENTOS_PROTOCOLO') == 'X';
        const partidaValida = cents(vm.get('model.MOVIMENTOS_IMPOSTO')) > 0;
        
        if(!configs.getClientName().match(/prudenaco|casanova/)) {
            if(vm.get('model.MOVIMENTOS_ID_PESSOAS') == vm.get('model.DOCUMENTOS_ID_PESSOAS') || (configs.getClientName() == 'prudenmoveis' && !pessoaValida) ){
                Movimento.services.Pessoa.criarJanela();
                return;
            }    
        }
    
        try {
            const formaPagamento = vm.get('formasDePagamento');
            const turnoEntrega = configs.getClientName() == 'prudenmoveis' ? vm.get('model.MOVIMENTOS_ITENS')[0]['MOVIMENTOSITENS_HORAENTREGA'] : 'M';
            const emissao = momentTz(vm.get('model.MOVIMENTOS_EMISSAO')).hours(0).minutes(0).seconds(0);
            const limite = momentTz(emissao).add(5, 'days');
            const dentroValidade =  momentTz(limite.format()).isSameOrAfter(hoje);
            const abaixoLimiteEntrega = await this.checarEntregaPrudenmoveis();
    
            if(configs.getClientName() == 'prudenmoveis') {
                if(!dentroValidade) {
                    throw 'Exportando orçamento com validade expirada - contate gerência';
                }   

                if(!partidaValida) {
                    throw 'Exportando orçamento sem valor de partida - Corrigir';                    
                }
    
                if( cents(vm.get('model.PESSOAS_ID_CIDADES')) != cents(vm.get('model.EMPRESAS_ID_CIDADES')) &&
                    !abaixoLimiteEntrega &&
                    vm.get('model.CIDADES_STATUS') != 'P' &&  // Cidades promocionais
                    cents(vm.get('model.MOVIMENTOS_FRETE')) == 0) { 
                    throw 'Exportando orçamento Suburbano sem valor de frete - Não permitido';
                }

                view.initGauge('Verificando caixa diário...');
                const statusCaixa = await Caixa.services.Model.getStatus(hoje);
                view.stopGauge(true);
    
                if(statusCaixa == 'F') {
                    throw 'O caixa diário está fechado!';
                }
                
                if(!statusCaixa) {
                    throw 'O caixa diário não foi aberto!';
                }    
            }
    
            if(formaPagamento){
                
                if(!turnoEntrega) {
                    throw 'Informe os dados de entrega/montagem';
                }

                if(vm.get('model.MOVIMENTOS_ID_PESSOAS') == vm.get('model.DOCUMENTOS_ID_PESSOAS')){
                    throw 'Pessoa sem cadastro - Cadastre';
                }        
                
                if(Movimento.services.FormasPagamento.validar({
                    obrigatorio: true,
                    validarValor: 'liquido',
                    naoExibir: true,
                })) {
                    Movimento.services.ImportacaoExportacao.paraPedido(view, list);
                } else {
                    throw 'Informe a forma de pagamento';
                }    
            } else {
                Movimento.services.ImportacaoExportacao.paraPedido(view, list);
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao exportar para pedido');
        }

        view.stopGauge();
    },

    onParaPedidoCompraClick: function(itemMenu, e) {
        if(this.getRecord().get('MOVIMENTOS_STATUS') == 'F') {
            Ext.Note('warning', 'Solicitação de Compra já exportada');
            return;
        } else if(this.getRecord().get('MOVIMENTOS_STATUS') == 'C') {
            Ext.Note('warning', 'Solicitação de Compra Cancelada');
            return;
        }
        
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraPedidoCompra(form, list);
    },

    onParaRequisicaoClick: function(itemMenu, e) {
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraRequisicao(form, list);
    },

    onParaOrdemServicoClick: function(itemMenu, e){
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraOrdemServico(form, list);
    },

    onParaDevolucaoClick: function(itemMenu, e) {

        if(this.getViewModel().get('isSistemaAprovacao')) {
            if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'P') {
                Ext.Note('warning', 'Pedido pendente de aprovação');
                return;
            } else if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                Ext.Note('warning', 'Pedido reprovado');
                return;
            }
        }
        
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraDevolucao(form, list);
    },
    
    onParaNotaEletronicaClick: async function(itemMenu, e) {

        if(this.getViewModel().get('isSistemaAprovacao')) {
            if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'P') {
                Ext.Note('warning', 'Pedido pendente de aprovação');
                return;
            } else if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                Ext.Note('warning', 'Pedido reprovado');
                return;
            }
        }

        if(configs.getClientName() == 'prudenmoveis') {
            if(momentTz(this.getRecord().get('MOVIMENTOS_EMISSAO')).isSameOrBefore('2020-09-01')) {
                Ext.Note('warning', 'Exportação não permitida - Contate o suporte');
                return;
            }
        }

        if(configs.getClientName().match(/racaforte|prudenaco|stilomoveis/)) { // Checar serieorigem depois, testar bem, se ficar ok ativar pra todos
            const idChecar = this.getRecord().get('MOVIMENTOS_ID');
            if(idChecar > 0) {
                const queryMovAtual = await SamosUtils.Request.nodeApi({
                    url: `/consultas/getmovimento`,
                    method: 'GET',
                    query: { id: idChecar }
                });    
                if(queryMovAtual.results.length > 0) {
                    if(queryMovAtual.results[0]['MOVIMENTOS_SERIEORIGEM'] == 'NE') {
                        Ext.Note('warning', 'Já foi faturado na NF-e: ' + queryMovAtual.results[0]['MOVIMENTOS_NUMEROORIGEM'].toString() + ' - Não permitido exportar novamente');
                        return;
                    }
                }
            }    
        }
        
        if(this.getViewModel().get('isPedido') && configs.getClientName() == 'racaforte') {
            const model = this.getRecord();
            const itens = model.get('MOVIMENTOS_ITENS') || []; 

            const algumSemLote = itens.some(item => {
                return item['PRODUTOS_DERIVADO'] != 'F' && cents(item['MOVIMENTOSITENS_ID_LOTES']) == 0;
            });
    

            if(algumSemLote) {
                Ext.Note('warning', 'Informe o lote dos produtos');
                this.onPartidasClick();
                return;
            }
        }
        
        const form = this.getView();
        const list = this.getListView();
        const obrigatorio = Movimento.services.Caixa.receberObrigatorio();
        const valido = Movimento.services.Caixa.caixaValido();

        if(obrigatorio && !valido){
            Ext.Note('warning', 'Preencha o caixa');
        } else if(this.getViewModel().get('isVendaConsumidor')){
            Ext.Note('warning', '<b>Venda Consumidor:</b><br><br>Faça o cadastro do cliente antes de emitir NF')
        } else {
            Movimento.services.ImportacaoExportacao.paraNotaEletronica(form, list);
        }
    },

    onParaRomaneioEntregaClick: function(itemMenu, e) {
        const model = this.getRecord();
        const romaneios = model.get('ROMANEIOS_MOVEIS') || [];
        let siglarom = configs.getClientName() == 'stilomoveis' ? 'RN' : 'CR';

        if(romaneios.some(romaneio => romaneio['DOCUMENTOS_NOME'].match(/Entrega/))){
            Ext.Note('warning', 'Este movimento já está em romaneio');
            return;

        } else if(this.getViewModel().get('isSistemaAprovacao')) {
            if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'P') {

            } else if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                Ext.Note('warning', 'Pedido reprovado');
                return;
            }
        }
        
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraRomaneioEntrega(form, list, siglarom);
    },

    onParaRomaneioClienteRetirouClick: function(itemMenu, e) {
        const model = this.getRecord();

        const romaneios = model.get('ROMANEIOS_MOVEIS') || [];

        if(romaneios.some(romaneio => romaneio['DOCUMENTOS_NOME'].match(/Entrega/))){
            Ext.Note('warning', 'Este movimento já está em romaneio');
            return;

        } else if(this.getViewModel().get('isSistemaAprovacao')) {
            if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'P') {
                
            } else if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                Ext.Note('warning', 'Pedido reprovado');
                return;
            }
        }
        
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraRomaneioEntrega(form, list, 'CR');
    },

    onParaRomaneioEntregueOrcamentoClick: function(itemMenu, e) {
        const model = this.getRecord();
        const romaneios = model.get('ROMANEIOS_MOVEIS') || [];

        if(romaneios.some(romaneio => romaneio['DOCUMENTOS_NOME'].match(/Entrega/))){
            Ext.Note('warning', 'Este movimento já está em romaneio');
            return;

        } else if(this.getViewModel().get('isSistemaAprovacao')) {
            if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'P') {
                
            } else if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                Ext.Note('warning', 'Pedido reprovado');
                return;
            }
        }
        
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraRomaneioEntrega(form, list, 'EO');
    },

    onParaRomaneioMontagemClick: function(itemMenu, e) {
        const model = this.getRecord();
        const romaneios = model.get('ROMANEIOS_MOVEIS') || [];

        if(romaneios.some(romaneio => romaneio['DOCUMENTOS_NOME'].match(/Montagem/))){
            Ext.Note('warning', 'Este movimento já está em romaneio');
            return;

        } else if(this.getViewModel().get('isSistemaAprovacao')) {
            if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'P') {
                Ext.Note('warning', 'Pedido pendente de aprovação');
                return;
            } else if(this.getRecord().get('MOVIMENTOS_SITUACAO') == 'R') {
                Ext.Note('warning', 'Pedido reprovado');
                return;
            }
        }
        
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraRomaneioMontagem(form, list);
    },

    onParaNotaConsumidorClick: function(itemMenu, e) {
        const model = this.getRecord();
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraNotaConsumidor(form, list);
    },
    
    onEnviarSMSClick: async function(btn, e) {
        const form = this.getView();
        Movimento.services.Sms.criarJanela(form);
    },
    
    onGerarLinkPDFClick: async function(btn, e) {
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();
        const layout = model.get('DOCUMENTOS_LAYOUT');

        try {
            if(!model.get('DOCUMENTOS_LAYOUT')) {
                throw 'Informe o layout de impressão em Documentos > Layout';
            }
    
            if(
                configs.getMovimentos().senhaImpressao && 
                !vm.get('isSupervisor') &&
                !this.permiteImpressao && 
                (
                    vm.get('isOrcamento') && 
                    configs.getClientName() == 'prudenmoveis'
                ) ||
                configs.getMovimentos().senhaImpressao && 
                !vm.get('isSupervisor') &&                
                !this.permiteImpressao && 
                vm.get('isPedido') && 
                model.get('MOVIMENTOS_PROTOCOLO') != ''
            ) {
                const nivel = (vm.get('isPedido') ? 1 : 3);
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
                this.permiteImpressao = true;
                this.onGerarLinkPDFClick();
    
            } else {
                delete this.permiteImpressao;
    
                view.initGauge('Gerando Link PDF...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/${layout}`,
                    method: 'GET',
                    query: {
                        id            : model.get('MOVIMENTOS_ID'),
                        numero        : model.get('MOVIMENTOS_NUMERO'),
                        empresa       : configs.getEmpresa().id,
                        empresacnpj   : configs.getEmpresa().cnpj,
                        empresanome   : configs.getEmpresa().nome,        
                        documento     : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                        start         : 0,
                        limit         : 1,
                        titledocumento: view.title,
                        diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape,
                        removerlogo   : false
                    }
                });

                const pdfUrl = `${configs.getApiNode()}/${queryPDF.results[0]['name']}`;

                await SamosUtils.Msg.alert('Copiar link para área de transferência?', pdfUrl);

                await navigator.clipboard.writeText(pdfUrl);

                Ext.Note('success', 'Copiado para área de transferência');
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao gerar link PDF');
        }

        view.stopGauge();
    },
    
    onEnviarEmailClick: async function(btn, e) {
        const form = this.getView();
        const vm = this.getViewModel();
        const model = this.getRecord();
        const id = model.get('MOVIMENTOS_ID');
        try {
            await Movimento.services.Email.enviar(form);
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        form.stopGauge();
    },

    onGerarPDFsClick: async function(btn, e) {
        const view = this.getView();        
        const model = this.getRecord();
        const id = model.get('MOVIMENTOS_ID');
        const ufEmitente = configs.getEmpresa().estado;
        const ufDestino = model.get('MOVIMENTOS_ID_PROPRIEDADES') > 0 ? model.get('CIDADES_ESTADOPROPRIEDADE') : model.get('CIDADES_ESTADO');
        const estadosRegiao12 = model.get('EMPRESAS_REGIAO12');
        const isLocal = (ufEmitente == ufDestino);
        const isRegiao12 = estadosRegiao12.indexOf(ufDestino) > 0;
        let nomeCompleto = '';
        let nomeSemExtensao = '';
        let caixaImprimir = localStorage.getItem('letraCaixa') || await this.getLetraCaixa();

        view.initGauge(); 
                
        if(caixaImprimir != 'N') {
            const queryPDFNfe = await SamosUtils.Request.nodeApi({   // Gera o pdf da nota
                url: `/docsfiscais/${configs.getClientName()}/danfe/${id}`,
                method: 'GET',
                data: {
                    semlogo: 'T',                    
                    convenio: isLocal ? configs.getProdutos().conveniolocal :
                              isRegiao12 ? configs.getProdutos().convenio12 :
                              configs.getProdutos().conveniooutros,
                    tabelaservicos: configs.getMovimentos().tabelaServicos || []          
                }
            });
    
            if(queryPDFNfe.results[0]['name']) {
                nomeCompleto = queryPDFNfe.results[0]['name'].split('/').slice(-1).join('').toString();
                nomeSemExtensao = nomeCompleto.split('.')[0].toString();
                await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentosredis`,
                    method: 'POST',
                    data: {
                        'MOVIMENTOSREDIS_ID'         : model.get('MOVIMENTOS_ID'),
                        'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS', 
                        'MOVIMENTOSREDIS_IMPRESSORA' : 'NOTAELETRONICA',
                        'MOVIMENTOSREDIS_LAYOUT'     : 'NFE',
                        'MOVIMENTOSREDIS_CAIXA'      : caixaImprimir,
                        'MOVIMENTOSREDIS_PARAMETROS' : nomeSemExtensao
                    }
                });
            }    
        }

        // Agora o boleto

        const dataFinanceiro = (model.get('MOVIMENTOS_FINANCEIROS') || []);
        const titulos = dataFinanceiro.filter(titulo => {
            return (
                titulo['PESSOAS_TIPO'] != configs.getFinanceiros().tipoFinanceira &&
                titulo['FINANCEIROS_ID_PESSOAS'] != '999999' &&
                titulo['FINANCEIROS_STATUS'] != 'P' &&
                titulo['FINANCEIROS_ID_PORTADORES'] == configs.getEmpresa().portador
            );
        });
        
        if(titulos.length > 0) {
            const ids = titulos.map(titulo => titulo['FINANCEIROS_ID']).join(',');

            const idsSemNossoNumero = titulos.filter(titulo => (cents(titulo['FINANCEIROS_NOSSONUMERO']) == 0)).map(titulo => titulo['FINANCEIROS_ID']).join(',');
    
            if(idsSemNossoNumero.length > 0) {
                await this.gerarNossoNumero(idsSemNossoNumero, configs.getEmpresa().portador);
            }

            const layBoleto = configs.getFinanceiros().boletos.pix ? 'boletospix' : 'boletos';
    
            if(caixaImprimir != 'N') {
                const queryPDFBoleto = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/${layBoleto}`,
                    method: 'GET',
                    data: {
                        ids: ids,
                        empresa: configs.getEmpresa().id,
                        portador: titulos[0]['FINANCEIROS_ID_PORTADORES']
                    }
                }); 
                
                if(queryPDFBoleto.results[0]['name']) {
                    nomeCompleto = queryPDFBoleto.results[0]['name'].split('/').slice(-1).join('').toString();
                    nomeSemExtensao = nomeCompleto.split('.')[0].toString();    
                    const idTitulo = titulos[0]['FINANCEIROS_ID'];
                    await SamosUtils.Request.nodeApi({
                        url: `/processos/movimentosredis`,
                        method: 'POST',
                        data: {
                            'MOVIMENTOSREDIS_ID'         : idTitulo,
                            'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS',
                            'MOVIMENTOSREDIS_IMPRESSORA' : 'BOLETO',
                            'MOVIMENTOSREDIS_LAYOUT'     : 'BOL',
                            'MOVIMENTOSREDIS_CAIXA'      : caixaImprimir,
                            'MOVIMENTOSREDIS_PARAMETROS' : nomeSemExtensao
                        }
                    });
                }    
            }

        }

        view.stopGauge();

        if(caixaImprimir != 'N') {
            Ext.Note('success', 'PDFs Gerados com Sucesso!')
        }    

        return ;

    },

    getLetraCaixa: async function() {
        const letraCaixa = await SamosUtils.Msg.prompt('Caixa', 'Digite o caixa em operação - A, B ou (N)enhum', '');
            
        if(letraCaixa === false || !letraCaixa.match(/A|B|N/)) { //cancelado pelo usuario
            Ext.Note('warning', 'Informe a letra do caixa');
            return await this.getLetraCaixa();
        } else {
            localStorage.setItem('letraCaixa', letraCaixa);
            return letraCaixa;
        }
    },


    colapseDadosOperacaoNota: function() {
        const txtOperacaoNota = this.lookup('operacaonota');

        if(!txtOperacaoNota.readOnly) {
            txtOperacaoNota.up('samoswidgets-defaultform').collapse();
        }
    },

    getDomOfElement: function(el) {
        var body = Ext.getBody();
        var cmp;
        do {
            cmp = Ext.getCmp(el.id);
            el = el.parentNode;
        } while (!cmp && el !== body);
        return cmp;
    },

    //Para testes onde preciso que o botao fechar nao valide nada
    fecharDireto: async function(){
        this.lookup('observacoes').focus(true);
        this.finalizarEdicao();
        this.getView().stopGauge(true);
    },

    onFecharClick: async function(btn, e) {

        this.getView().initGauge();

        setTimeout(() => {
            const form               = this.getView();
            const vm                 = this.getViewModel();
            const txtObservacoes     = this.lookup('observacoes');
            const txtBaseICMS        = this.lookup('baseicms');
            const finalidadeNormal   = this.getViewModel().get('finalidadeNormal');
            const isComplementar     = this.getViewModel().get('isComplementar');
            const isNotaEletronica   = this.getViewModel().get('isNotaEletronica');
            const isNotaEntrada      = this.getViewModel().get('isNotaEntrada');
            const isPedidoCompra     = (this.getViewModel().get('isPedidoCompra') || 
                                       this.getViewModel().get('isOrcamentoPrazo') ||
                                       this.getViewModel().get('isPreVendaPrazo'));
            const txtsOperacao       = this.getView().query('textfield[reference^="operacao"]');
    
            txtObservacoes.up('samoswidgets-defaultform').expand();
            txtBaseICMS.up('samoswidgets-defaultform').expand();

            if(isPedidoCompra && vm.get('model.MOVIMENTOS_ID_PRAZOS') != 999) {
                this.gerarFinanceiroCompra();
            }

            if(isComplementar) {
                Ext.Msg.alert('Atenção', `CFOP Complementar - O sistema manterá somente os valores de impostos`);
            }
 
            //Ignora essa finalizarEdicao da grid se é nota de entrada
            if(!isNotaEntrada){
                form.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());
            }

            const stProdutos = this.lookup('produtos').getStore(); 

            if(configs.getClientName() == 'herbiquimica' && isNotaEletronica) {
                this.checarHerbicidas(stProdutos);
            }      
            
            txtsOperacao.forEach(txt => txt.setSearchedId(txt.getValue()));

            this.validarCabecalho()
                .then(async () => {
                    if(this.getViewModel().get('isDevolucao')) {
                        const storeProdutos = this.lookup('produtos').getStore();
                        return await Movimento.services.Devolucao.removerItensNaoDevolvidos(form, storeProdutos);
                    }
                })
                .then(() => {
                    if(!configs.getMovimentos().recalculoSync) {
                        if(isPedidoCompra) {
                            this.mixins.produtos.calcularPedidoCompra.call(this);
//                      } else if(finalidadeNormal && !isComplementar && !isOrcamento) { Não sei o porque desse !isOrcamento, vamos bloquear e monitorar pra ver
                        } else if(finalidadeNormal && !isComplementar) {
                            this.mixins.produtos.fazerSomasERateios.call(this);
                        }
                    }

                    return true;
                })
                .then(valido => {
                    if(valido){
                        if(configs.getMovimentos().ramoRomaneio == 'moveis'){
                            return Movimento.services.EntregaMoveis.exibirNoMovimento();
                        } else {
                            return Movimento.services.EntregaConstrucao.exibirNoMovimento();
                        }
                    } else {
                        return false;
                    }
                })
                .then(async valido => {
                    if(valido/* && finalidadeNormal*/) {
                        //quanto for implementar try/catch aqui
                        //pegar o erro que retorna do calculo do imposto
                        //da pra retornar erros customizaveis de cada uma dessas checagens
                        await Movimento.services.Impostos.calcular(form);
                        this.mixins.produtos.checarOperacao.call(this);
                    }
                    return valido;
                })
                .then(valido => {
                    return valido ? Movimento.services.Model.confereProducao(form) : false;
                })
                .then( async valido => {
                    if( cents( configs.getFinanceiros().limiteCredito ) == 0 || vm.get('model.PESSOAS_ID_USUARIOS') == 999){
                        return true;

                    }else{
                        //Se for venda a vista
                        if( vm.get('model.MOVIMENTOS_ID_PRAZOS') == 1 ){ return true };
                        //Se uma operação diferente de venda
                        if( vm.get('model.OPERACOES_ACAO') != 'VN' ){ return true };

                        if( (cents(vm.get('model.MOVIMENTOS_TOTAL')) + cents(vm.get('model.ABERTO_FINANCEIROPESSOA'))) > cents( configs.getFinanceiros().limiteCredito ) ){
                            //pedir senha
                            if(configs.getFinanceiros().senhaLimiteCredito) {
                                const nivel = 1;
                                if( vm.get('jaDigitouSenha') == true ){
                                    return true;
                                }
    
                                Ext.Note('warning', 'Limite de crédito excedido!');
    
                                const pSenha = await( 
                                    new Promise( (resolve, reject) => {
                                        Ext.create({ 
                                            xtype: 'samoswidgets-senhanivel',
                                            customTitle: 'Limite excedido' 
                                        })
                                            .iniciar(nivel)
                                            .then(() => {
                                                /*acao ao permitir*/
                                                resolve(true);
                                                vm.set('jaDigitouSenha', true);
                                            })
                                            .catch(() => {
                                                resolve(false);          
                                            });
                                    } ) 
                                );
    
                                if( pSenha ){
                                    return true;
                                }
                                return false;    
                            } else {
                                if(vm.get('model.PESSOAS_ID_USUARIOS') == 999) {
                                    Ext.Note('warning', 'Limite de crédito excedido liberado.');
                                    return true;
                                } else {
                                    Ext.Note('warning', 'Limite de crédito excedido!');
                                    return false;   
                                }
                            }                           
                        }else{
                            return true;
                        }                        
                    }
                })
                .then(valido => {
                    return valido ? Movimento.services.Transporte.validar() : false;
                })
                .then(valido => {
                    return valido ? Movimento.services.Model.notaEntradaUnica(form) : false;
                })
/*                .then(valido => {
                    return valido ? Movimento.services.Model.confereChaveNFe(form) : false;
                })*/
                .then(valido => {
                    return valido ? Movimento.services.Model.atualizarStatusNotaEntrada(form) : false;
                })
                .then(valido => {
                    return valido ? Movimento.services.Divergencias.validar(form) : false;
                })
                .then(valido => {
                    if(valido){
                        this.checarValoresCabecalho(form);
                        return true;
                    } else {
                        return false;
                    }
                })
                .then(valido => {
                    return valido ? Movimento.services.Caixa.validarPagar() : false;
                })
                .then(valido => {
                    if(valido){
                        this.lookup('observacoes').focus(true);
                        this.finalizarEdicao();
                    }
                    this.getView().stopGauge(true);
                })
                .catch(e => {
                    console.error(e);
                    this.getView().stopGauge(true);
                });
        }, 100);
    },

    checarValoresCabecalho: function(form) {
        if(!this.getViewModel().get('isNotaEntrada')){
            const produtos = this.lookup('produtos').getStore().data.items || [];

            if(this.getViewModel().get('isPedidoCompra')) {
                const somaFretes = produtos.reduce((totalfrete, produto) => {
                    const freteitem = cents(produto.get('MOVIMENTOSITENS_FRETE'));                   
                    return totalfrete + freteitem;
                }, 0);    
                const somaSeguros = produtos.reduce((totalseguro, produto) => {
                    const seguroitem = cents(produto.get('MOVIMENTOSITENS_SEGURO'));
                    return totalseguro + seguroitem;
                }, 0);    
                const somaIpi = produtos.reduce((totalipi, produto) => {
                    const ipiitem = cents(produto.get('MOVIMENTOSITENS_VALORIPI'));
                    return totalipi + ipiitem;
                }, 0);

                form.model.set('MOVIMENTOS_FRETE', somaFretes / 100);
                form.model.set('MOVIMENTOS_SEGURO', somaSeguros / 100);
                form.model.set('MOVIMENTOS_VALORIPI', somaIpi / 100);
            }

            const desconto = cents(form.model.get('MOVIMENTOS_DESCONTOS'));
            const ipi      = cents(form.model.get('MOVIMENTOS_VALORIPI'));
            const frete    = cents(form.model.get('MOVIMENTOS_FRETE'));
            const valorst  = cents(form.model.get('MOVIMENTOS_VALORST'));
            const seguro   = configs.getMovimentos().usarMarkup ? 0 : cents(form.model.get('MOVIMENTOS_SEGURO'));
            const despesas = cents(form.model.get('MOVIMENTOS_DESPESAS'));

            const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;

            const somaProdutos = produtos.reduce((total, produto) => {
                //converte o preco para inteiro, ex: R$ 1,234567 fica 1234567 (para bater os calculos no javascript)
                const precoInt = toPrecision(produto.get('MOVIMENTOSITENS_PRECO'), casasDecimaisPreco);
                const qtde     = grams(produto.get('MOVIMENTOSITENS_QUANTIDADE')) || 0;
                
                return total + Math.round((precoInt * qtde) / 1000);
            }, 0);
            
            //após calcular divide pelas casas decimais novamente e arredonda para centavos para calcular os outros campos
            const somaProdutosCents = Math.round(somaProdutos / Math.pow(10, (casasDecimaisPreco - 2)));
    
            form.model.set('MOVIMENTOS_PRODUTOS', somaProdutosCents / 100);
            form.model.set('MOVIMENTOS_TOTAL', (somaProdutosCents - desconto + frete + seguro + despesas + ipi + valorst) / 100);
        } /*else {  // Novo - Exclusivo nota de entrada
            const produtos = this.lookup('produtos').getStore().data.items || [];

            const somaImposto = produtos.reduce((totalimposto, produto) => {
                const impostoitem = cents(produto.get('MOVIMENTOSITENS_IMPOSTO'));                   
                return totalimposto + impostoitem;
            }, 0);    
                
            form.model.set('MOVIMENTOS_IMPOSTO', somaImposto / 100);
        }*/
    },

    onPessoasEditClick: function(txt) {
        Movimento.services.Documento.iniciarVendaConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasCloseClick: function(txt) {
        Movimento.services.Documento.cancelarVendaConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasChange: function(){
        Movimento.services.Documento.checkVendaConsumidor(this.getView());
    },

    onEntregaChange: function(){
        Movimento.services.Documento.checkEntrega(this.getView());
        this.fazerSomasERateios();
    },

    onEfetivarClick: async function(btn, e) {
        const view = this.getView();
        
        try {
            const model = this.getRecord();
            const situacao = parseInt(model.get('MOVIMENTOS_SITUACAO'));
            const origem = model.get('MOVIMENTOS_NUMEROORIGEM') ? parseInt(model.get('MOVIMENTOS_NUMEROORIGEM')) : 0;
           
            // Se for abatimento do financeiro, obrigatoriamente tem que ter origem
            if(situacao === 0 && origem === 0) {  
                throw 'Para abatimento no financeiro, devolução deve importar do pedido';
            } 
            
            if(situacao === 0) {  // Se abatimento do financeiro
                const queryFinanceiro = await SamosUtils.Request.nodeApi({
                    url: `/financeiros`,
                    method: 'GET',
                    query: {
                        empresa: model.get('MOVIMENTOS_ID_EMPRESAORIGEM'),
                        numero: model.get('MOVIMENTOS_NUMEROORIGEM'),
                        serie : model.get('MOVIMENTOS_SERIEORIGEM'),
                        tipo: 'R'
                    }
                }); 
                if(queryFinanceiro.results.length == 0) {
                    throw 'Não há títulos para abater';
                }   
            }


            if(await SamosUtils.Msg.confirm('Deseja realmente efetivar a devolução?')){
                view.initGauge();  

                if(situacao != 3) {  // Se não for nula quanto ao caixa
                    await Movimento.services.Devolucao.gravar({
                        empresa       : configs.getEmpresa().id,
                        empresaorigem : model.get('MOVIMENTOS_ID_EMPRESAORIGEM'),
                        numeroorigem  : model.get('MOVIMENTOS_NUMEROORIGEM'),
                        serieorigem   : model.get('MOVIMENTOS_SERIEORIGEM'),
                        numero        : model.get('MOVIMENTOS_NUMERO'),
                        serie         : model.get('MOVIMENTOS_SERIE'),
                        iddevolucao   : model.get('MOVIMENTOS_ID'),
                        emissao       : model.get('MOVIMENTOS_EMISSAO'),
                        hora          : model.get('MOVIMENTOS_HORA'),
                        pessoa        : model.get('MOVIMENTOS_ID_PESSOAS'),
                        valordevolvido: cents(model.get('MOVIMENTOS_TOTAL')),
                        situacaodev   : model.get('MOVIMENTOS_SITUACAO'),
                        usuario       : configs.getUsuario().id,
                        log           : SamosUtils.Info.getLog()
                    })
                }
                
                model.set({
                    'MOVIMENTOS_STATUS': 'F',
                    'MOVIMENTOS_ENTRADASAIDA': momentServer().format('YYYY-MM-DD'),
                    'MOVIMENTOS_LOG': SamosUtils.Info.getLog()
                });

                this.save(model);

                Ext.Note('success', 'Devolução efetivada com sucesso!');
            }
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao efetivar devolução');
        }
        
        try { view.stopGauge(); } catch(e) {}
    },

    onTransferirClick: function(itemMenu, e) {
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraTransferencia(form, list);
    },

    onTransferirParaCDClick: function(itemMenu, e) {
        const form = this.getView();
        const list = this.getListView();

        Movimento.services.ImportacaoExportacao.paraTransferencia(form, list);
    },

    onVincularClick: function(itemMenu, e) {
        const form = this.getView();
        const list = this.getListView();
        const model = this.getRecord();

        if(parseInt(model.get('MOVIMENTOS_NUMEROORIGEM')) == 0 || model.get('MOVIMENTOS_SERIEORIGEM') == '') {
            Ext.Note('warning', 'Informe o número e a série do pedido de compra antes de vincular');
        } else {
            Movimento.services.ImportacaoExportacao.paraNotaEntrada(form, list);
        }
    },



    onImprimirClick: async function(impressora, layout) {
        if(impressora == 'Visualizar') {
            this.onVisualizarClick();
            return;
        }

        const view = this.getView();

        try {
            const movimento = view.getViewModel().get('model');
            const idMovimento = movimento.get('MOVIMENTOS_ID');
            const idEmpresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');
            let qtdePaginas;

            if(configs.getMovimentos().qtdePaginasImpressao > 1) {
                qtdePaginas = await new Promise(resolve => {
                    const win = Ext.create({
                        xtype: 'window',
                        title: 'Cópias',
                        autoShow: true,
                        width: 250,
                        layout: {
                            type: 'vbox',
                            align: 'stretch'
                        },
                        bodyPadding: 10,
                        items: [
                            {
                                xtype: 'container',
                                layout: 'hbox',
                                items: [
                                    {
                                        xtype: 'button',
                                        text: '-',
                                        margin: '0 3 0 0',
                                        ui: `primary-${configs.getTema()}`,
                                        style: {
                                            boxShadow: 'none',
                                            borderRadius: '0px'
                                        },
                                        handler: () => {
                                            const field = win.down('numberfield');
                                            const value = field.getValue();
                                            field.setValue(value - (value == 1 ? 0 : 1));
                                        }
                                    },
                                    {
                                        xtype: 'numberfield',
                                        margin: '0',
                                        flex: 1,
                                        value: configs.getMovimentos().qtdePaginasImpressao || 1,
                                        hideTrigger: true,
                                        fieldStyle: 'text-align: right;',
                                        minValue: 1,
                                        allowDecimals: false,
                                        listeners: {
                                            keydown: function(txt, event) {
                                                if(SamosUtils.Events.isEnter(event)) {
                                                    resolve(txt.getValue());
                                                    win.destroy();
                                                }
                                            }
                                        }
                                    },
                                    {
                                        xtype: 'button',
                                        text: '+',
                                        margin: '0 0 0 3',
                                        style: {
                                            boxShadow: 'none',
                                            borderRadius: '0px'
                                        },
                                        ui: `primary-${configs.getTema()}`,
                                        handler: () => {
                                            const field = win.down('numberfield');
                                            field.setValue(field.getValue() + 1);
                                        }
                                    }
                                ]
                            },
                            {
                                xtype: 'container',
                                layout: {
                                    type: 'hbox',
                                    align: 'center',
                                    pack: 'center'
                                },
                                items: [
                                    {
                                        xtype: 'button',
                                        text: 'Imprimir',
                                        margin: '10 7 7 7',
                                        ui: `primary-${configs.getTema()}`,
                                        handler: () => {
                                            resolve(win.down('numberfield').getValue());
                                            win.destroy();
                                        }
                                    },
                                    {
                                        xtype: 'button',
                                        text: 'Sair',
                                        margin: '10 7 7 0',
                                        ui: `tertiary-${configs.getTema()}`,
                                        handler: function() {
                                            resolve(0);
                                            win.destroy();
                                        }
                                    }
                                ]
                            }
                        ]
                    });
                });        
            } else {
                qtdePaginas = configs.getMovimentos().qtdePaginasImpressao || 1;
            }

            let caixaImprimir = localStorage.getItem('letraCaixa') || await this.getLetraCaixa();

            if(qtdePaginas > 0) {

                SamosUtils.Request.nodeApi({
                    url: `/processos/movimentosredis`,
                    method: 'POST',
                    data: {
                        'MOVIMENTOSREDIS_ID'         : idMovimento,
                        'MOVIMENTOSREDIS_EMPRESA'    : idEmpresa,
                        'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS', 
                        'MOVIMENTOSREDIS_IMPRESSORA' : impressora,
                        'MOVIMENTOSREDIS_LAYOUT'     : layout,
                        'MOVIMENTOSREDIS_PAGINAS'    : qtdePaginas,
                        'MOVIMENTOSREDIS_CAIXA'      : caixaImprimir,
                        'MOVIMENTOSREDIS_PARAMETROS' : ''
                    }
                });
    
                Ext.Note('success', 'Enviado para impressora');
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onFolhainteiraClick: async function(impressora, layout) {
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();

        try {

            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/folhainteira`,
                method: 'GET',
                query: {
                    dadosbrutosform  : JSON.stringify({
                        'MOVIMENTOS_CPFCNPJ'  : model.get('MOVIMENTOS_CPFCNPJ'),
                        'PESSOAS_INSCRICAO'   : model.get('PESSOAS_INSCRICAO'),
                        'MOVIMENTOS_TELEFONE' : model.get('MOVIMENTOS_TELEFONE'),
                        'MOVIMENTOS_CELULAR'  : model.get('MOVIMENTOS_CELULAR'),
                        
                    } ),
                    id               : model.get('MOVIMENTOS_ID'),
                    numero           : model.get('MOVIMENTOS_NUMERO'),
                    empresa          : configs.getEmpresa().id,
                    empresacnpj      : configs.getEmpresa().cnpj,
                    empresanome      : configs.getEmpresa().nome,        
                    documento        : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    start            : 0,
                    limit            : 1,
                    titledocumento   : view.title,
                    diasvctorodape   : configs.getMovimentos().exibirDiasVctoRodape
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });
        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge()
    },

    onMeiafolhaClick: async function(impressora, layout) {
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();

        try {

            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/meiafolha`,
                method: 'GET',
                query: {
                    dadosbrutosform  : JSON.stringify({
                        'MOVIMENTOS_CPFCNPJ'  : model.get('MOVIMENTOS_CPFCNPJ'),
                        'PESSOAS_INSCRICAO'   : model.get('PESSOAS_INSCRICAO'),
                        'MOVIMENTOS_TELEFONE' : model.get('MOVIMENTOS_TELEFONE'),
                        'MOVIMENTOS_CELULAR'  : model.get('MOVIMENTOS_CELULAR'),
                        
                    } ),
                    id               : model.get('MOVIMENTOS_ID'),
                    numero           : model.get('MOVIMENTOS_NUMERO'),
                    empresa          : configs.getEmpresa().id,
                    empresacnpj      : configs.getEmpresa().cnpj,
                    empresanome      : configs.getEmpresa().nome,        
                    documento        : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    start            : 0,
                    limit            : 1,
                    titledocumento   : view.title,
                    diasvctorodape   : configs.getMovimentos().exibirDiasVctoRodape
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });
        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge()
    },

    gerarChamadaEtiqueta: async function(data, timeout = 30000) {
        let progress;
        let inicio;
    
        try {
//            progress = Ext.Progress(10000, 'Gerando etiqueta(s)');

            async function verificarStatus () {
//                await SamosUtils.Utils.sleep(2000);
        
                const queryEtiqueta = await SamosUtils.Request.nodeApi({ 
                    url: `/processos/etiquetas/${data['ETIQUETAS_ID']}`,
                    method: 'GET'
                });

                const etiqueta = queryEtiqueta[0];
    
                if(timeout && moment().diff(inicio) >= timeout){
                    throw new Error();
                }
    
                if(etiqueta['ETIQUETAS_STATUS'] != 'F') {
                    try {
                        await SamosUtils.Request.nodeApi({
                            url: `/processos/etiquetas/${data['ETIQUETAS_ID']}`,
                            method: 'DELETE'
                        });
    
                        clearInterval(progress);
                        Ext.MessageBox.hide();
                        
                        return etiqueta;
                    } catch(error) {
                        console.error(etiqueta);
                        throw error;
                    }
    
                } else {
                    return await verificarStatus();
                }
            }
    
            await SamosUtils.Request.nodeApi({
                url: `/processos/movimentosredis`,
                method: 'POST',
                data: data
            });
    
            inicio = moment();
            
            return await verificarStatus();
    
        } catch(error){ 
            clearInterval(progress);
            Ext.MessageBox.hide();  
            throw error;
        }
    },

    onVisualizarClick: async function() {
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();
        const layout = model.get('DOCUMENTOS_LAYOUT');

        try {
            if(!model.get('DOCUMENTOS_LAYOUT')) {
                throw 'Informe o layout de impressão em Documentos > Layout';
            }
    
            if(
                configs.getMovimentos().senhaImpressao && 
                !vm.get('isSupervisor') &&
                !this.permiteImpressao && 
                (
                    vm.get('isOrcamento') && 
                    configs.getClientName() == 'prudenmoveis'
                ) ||
                configs.getMovimentos().senhaImpressao && 
                !vm.get('isSupervisor') &&                
                !this.permiteImpressao && 
                vm.get('isPedido') && 
                model.get('MOVIMENTOS_PROTOCOLO') != ''
            ) {
                const nivel = (vm.get('isPedido') ? 1 : 3);
                await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
                this.permiteImpressao = true;
                this.onVisualizarClick();
    
            } else {
                delete this.permiteImpressao;
    
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/${layout}`,
                    method: 'GET',
                    query: {
                        dadosbrutosform  : JSON.stringify({
                            'MOVIMENTOS_CPFCNPJ'  : model.get('MOVIMENTOS_CPFCNPJ'),
                            'PESSOAS_INSCRICAO'   : model.get('PESSOAS_INSCRICAO'),
                            'MOVIMENTOS_TELEFONE' : model.get('MOVIMENTOS_TELEFONE'),
                            'MOVIMENTOS_CELULAR'  : model.get('MOVIMENTOS_CELULAR'),
                            
                        } ),
                        id               : model.get('MOVIMENTOS_ID'),
                        numero           : model.get('MOVIMENTOS_NUMERO'),
                        empresa          : configs.getEmpresa().id,
                        empresacnpj      : configs.getEmpresa().cnpj,
                        empresanome      : configs.getEmpresa().nome,        
                        documento        : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                        start            : 0,
                        limit            : 1,
                        titledocumento   : view.title,
                        diasvctorodape   : configs.getMovimentos().exibirDiasVctoRodape
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
    
                if(configs.getMovimentos().senhaImpressao && !vm.get('isPedidoCompra') && !vm.get('isDevolucao')){
                    const marcaImpressao = (model.get('MOVIMENTOS_PROTOCOLO').lastIndexOf("IMPRESSO") < 0) ;
                    
                    if(marcaImpressao) {
                        model.set('MOVIMENTOS_PROTOCOLO', 'IMPRESSO');
                        await model.save();
                        Ext.Note('success', 'Log de impressão salvo com sucesso!')
                    }
                }  
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge()
    },

    onEmitirClick: Ext.emptyFn,

    onManifestoClick: Ext.emptyFn,

    verificarDocumentosVencidos: async function( recordParam=null ){
        const view = this.getView();
        const vm = view.getViewModel();
        //Se for passado um model como parametro, ele usa o model passado na verificação
        const model = recordParam ? recordParam : this.getRecord();
        const documentosVencidos = await SamosUtils.ConsultasGenerica.getDocumentosVencidos( recordParam ? model.get('PESSOAS_ID') : model.get('MOVIMENTOS_ID_PESSOAS') );

        if( documentosVencidos.total > 0 ){
            return true;
        }else{
            return false;
        }
    },

    onClienteClick: async function() {
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();
        const layout = 'pedidoscliente';

        try {
        
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layout}`,
                method: 'GET',
                query: {
                    id            : model.get('MOVIMENTOS_ID'),
                    numero        : model.get('MOVIMENTOS_NUMERO'),
                    empresa       : configs.getEmpresa().id,
                    empresacnpj   : configs.getEmpresa().cnpj,
                    empresanome   : configs.getEmpresa().nome,        
                    documento     : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    start         : 0,
                    limit         : 1,
                    titledocumento: view.title,
                    diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge()
    },

    onAbastecimentoClick: async function() { // Abastecimento Prudenmoveis
        this.onImprimirClick('Visualizar');
    },

    onConferenciaClick: async function() {
        const view = this.getView();
        const model = this.getRecord();
        const layout = configs.getClientName() == 'prudenmoveis' ? 'abastecconferencia' :
                                                                   'pedidosconferencia';

        try {
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layout}`,
                method: 'GET',
                query: {
                    id            : model.get('MOVIMENTOS_ID'),
                    numero        : model.get('MOVIMENTOS_NUMERO'),
                    empresa       : configs.getEmpresa().id,
                    empresacnpj   : configs.getEmpresa().cnpj,
                    empresanome   : configs.getEmpresa().nome,        
                    documento     : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    start         : 0,
                    limit         : 1,
                    titledocumento: view.title,
                    diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge();
    },

    onPedidoClick: async function() {
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();
        const layout = 'pedidos';

        try {
        
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layout}`,
                method: 'GET',
                query: {
                    id            : model.get('MOVIMENTOS_ID'),
                    numero        : model.get('MOVIMENTOS_NUMERO'),
                    empresa       : configs.getEmpresa().id,
                    empresacnpj   : configs.getEmpresa().cnpj,
                    empresanome   : configs.getEmpresa().nome,        
                    documento     : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    start         : 0,
                    limit         : 1,
                    titledocumento: view.title,
                    diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge()
    },

    onRomaneioEntregaClick: async function() {
        const view = this.getView();
        const model = this.getRecord();
        const layout = 'romaneiopedido';

        const romEntrega = model.get('ROMANEIOS_MOVEIS') || [];

        if(romEntrega.length > 0) {
            if(romEntrega[0]['ROMANEIOS_STATUS'] != 'R') {
                Ext.Note('warning', 'Não há romaneio de retirada a imprimir');
                return;
            }    
        } else {
            Ext.Note('warning', 'Não há romaneio de retirada a imprimir');
            return;
        }

        try {
        
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/${layout}`,
                method: 'GET',
                query: {
                    id            : model.get('MOVIMENTOS_ID'),
                    numero        : model.get('MOVIMENTOS_NUMERO'),
                    empresa       : configs.getEmpresa().id,
                    empresacnpj   : configs.getEmpresa().cnpj,
                    empresanome   : configs.getEmpresa().nome,        
                    documento     : model.get('MOVIMENTOS_ID_DOCUMENTOS'),
                    start         : 0,
                    limit         : 1,
                    titledocumento: view.title,
                    diasvctorodape: configs.getMovimentos().exibirDiasVctoRodape
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });

        } catch(error) {
            SamosUtils.Msg.error(error, 'Erro ao imprimir');
        }

        view.stopGauge()
    },

    onComprovanteClick: async function(){
        const view = this.getView();
        const modelImpressao = this.getViewModel().get('model')
        const jaImpresso = modelImpressao.get('MOVIMENTOS_PROTOCOLO') == 'ENTREGA';

        if(modelImpressao.get('MOVIMENTOS_STATUS') == 'C') {
            Ext.Note('warning', 'Pedido Cancelado - Não permitido');
            return;
        }

        if(
            configs.getMovimentos().senhaImpressao && 
            !configs.getUsuario().privilegiado &&
            jaImpresso
        ) {
            const nivel = 3; 
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(nivel)
        }
        
        try {

            delete this.permiteImpressao;

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');
                const id = modelImpressao.get('MOVIMENTOS_ID');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/comprovantemoveis/${id}`,
                    method: 'GET'
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'window',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });

            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onCancelarClick: function() {
        const vm = this.getViewModel();
        const btnOpcoes = this.getView().down('button[text="Opções"]');
        const btnCaixa  = this.getView().down('button[text="Opções"]');
        const model = vm.get('initialValues') || vm.get('previousModel');
        const data = model && model.get ? model.data : model; 
        
        if(
            data &&
            configs.getMovimentos().ramoRomaneio == 'moveis' &&
            this.getView().title == 'Pedido'
        ) {
            if(btnOpcoes) {
                if(data['RESERVAS_STATUS'] != 'T'){
                    btnOpcoes.getEl().dom.style.backgroundColor = 'yellow';
                    btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                } else {
                    btnOpcoes.getEl().dom.style.backgroundColor = '';
                    btnOpcoes.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                }
            }
            if(btnCaixa) {
                if(data['MOVIMENTOS_STATUS'] != 'F'){
                    btnCaixa.getEl().dom.style.backgroundColor = 'yellow';
                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = 'black';
                } else {
                    btnCaixa.getEl().dom.style.backgroundColor = '';
                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                }
            }
        }

        if(this.getView().emExportacao) {
            this.onSairClick();
            this.getView().listView.destroy();
        } else {
            this.callParent(arguments);
        }
    },

    updateLog: function(txt, record) {
        const time = momentServer().format('HH:mm:ss');
        const logon = record.get('USUARIOS_LOGIN');
        const result = logon + ' ' + time;
        
        if(!configs.getMovimentos().carregaVendedorPessoa) {
            this.getRecord().set('MOVIMENTOS_LOG', result);
        }
        
        if(!configs.getMovimentos().carregaVendedor){
            if(this.getViewModel().get('isTransferencia')){
                this.lookup('empresadestino').focus(true);
            } else {
                const gridItems = this.lookup('produtos');
                Ext.defer(gridItems.focarNovoItem, 200, gridItems);
            }
        }
    },

    checarNotaExistente: function(txt, event) {
        if (SamosUtils.Events.isTab(event) || SamosUtils.Events.isEnter(event)) {
            Movimento.services.Model.notaEntradaUnica(this.getView());
        }        
    },

    changeCpfCnpj: function(txt) {
        var vm = this.getViewModel(),
            cpfCnpj = SamosUtils.String.onlyNumbers(txt.getValue());

        if(vm.get('readOnly') || !vm.get('isVendaConsumidor')) { 
            if(cpfCnpj.length == 11) {
                txt.setTextMask('___.___.___-__', cpfCnpj);
                txt.setFieldLabel('CPF');
            } else {
                txt.setTextMask('__.___.___/____-__', cpfCnpj);            
                txt.setFieldLabel('CNPJ');
            }
        } else {
            txt.setTextMask('___.___.___-__', cpfCnpj);
            txt.setFieldLabel('CPF');
        }
    },

    validateCpf: function (txt, event) {
        if (SamosUtils.Events.isTab(event) || SamosUtils.Events.isEnter(event)) {
            if(!SamosUtils.String.isCpf(txt.getValue())) {
                Ext.Note('warning', 'CPF Inválido');
                Ext.defer(txt.focus, 100, txt, [true]);
            }
        }
    },

    aposBuscarPessoa: async function(txt, record) {
        this.checkOperacao();

        const analisaCliente = configs.getEmpresa().checadebitos == 'T';
        const vm = this.getViewModel();

        if(vm.get('isOrcamento') && 
           configs.getClientName() == 'racaforte' &&
           record.get('CLASSE_CADASTRO').match(/D|E|M/)) {
           await this.mostrarObsPessoa(record);
        }

        if(
            (vm.get('isPedido') && analisaCliente) ||
            (vm.get('isOrcamento') && analisaCliente && configs.getClientName() == 'racaforte') ||
            (configs.getClientName().match(/turbotec|santana|malacrida|cirurcenter/) &&
             (vm.get('isPedido') || 
              vm.get('isPreVenda') ||
              vm.get('isNotaEletronica')) && analisaCliente)
        ) {    
           
            const debitos  = await Financeiro.services.Titulos.verificarDebitos(record.get('PESSOAS_ID'));

            if( cents( configs.getFinanceiros().limiteCredito ) > 0 ){
                const financeirosAberto = await Financeiro.services.Titulos.verificarCreditos(record.get('PESSOAS_ID'));
                const valorEmAberto = (cents(financeirosAberto[0]['ABERTOPESSOA']) / 100);
                vm.set('model.ABERTO_FINANCEIROPESSOA', valorEmAberto);
            }else{
                vm.set('model.ABERTO_FINANCEIROPESSOA', 0);
            }

            if(debitos.length > 0){
                const view = Ext.$('formmovimentosdebitospessoa')[0] || Ext.create({
                    xtype: 'formmovimentosdebitospessoa'
                });
    
                const total = debitos.reduce((total, titulo) => total += titulo['FINANCEIROS_ABERTO'], 0);
    
                view.getViewModel().set({
                    observacoes: record.get('PESSOAS_OBSERVACOES'),
                    dataDebitosPessoa: debitos,
                    totalFormatado: Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(total)
                });

                this.getView().add(view);
            } else {
                this.checkEmail(record);
            }
        } else if(vm.get('isTransferencia')){
            if(record.get('EMPRESAS_ID') == configs.getEmpresa().id) {
                Ext.Note('warning', 'Selecione outra empresa');
                Ext.defer(txt.focus, 200, txt, [true]);
            } else {
                this.checkEmail(record);
            }
        } else {
            this.checkEmail(record);
        }
    },

    onPropriedadesChange: async function() { 

        if(!configs.getPessoas().propriedades) {
            return;
        }

        this.checkOperacao();

        const analisaCliente = configs.getEmpresa().checadebitos == 'T';
        const vm = this.getViewModel();

        const record = this.getRecord();

        if(vm.get('isOrcamento') && 
           configs.getClientName() == 'racaforte' &&
           record.get('CLASSE_CADASTRO').match(/D|E|M/)) {
           await this.mostrarObsPessoa(record);
        }

        if(
            (vm.get('isPedido') && analisaCliente) ||
            (vm.get('isOrcamento') && analisaCliente && configs.getClientName() == 'racaforte') ||
            (configs.getClientName().match(/turbotec|santana/) &&
             (vm.get('isPedido') || 
              vm.get('isPreVenda') ||
              vm.get('isNotaEletronica')) && analisaCliente)
        ) {    
           
            const debitos  = await Financeiro.services.Titulos.verificarDebitos(record.get('PESSOAS_ID'));

            if( cents( configs.getFinanceiros().limiteCredito ) > 0 ){
                const financeirosAberto = await Financeiro.services.Titulos.verificarCreditos(record.get('PESSOAS_ID'));
                const valorEmAberto = (cents(financeirosAberto[0]['ABERTOPESSOA']) / 100);
                vm.set('model.ABERTO_FINANCEIROPESSOA', valorEmAberto);
            }else{
                vm.set('model.ABERTO_FINANCEIROPESSOA', 0);
            }

            if(debitos.length > 0){
                const view = Ext.$('formmovimentosdebitospessoa')[0] || Ext.create({
                    xtype: 'formmovimentosdebitospessoa'
                });
    
                const total = debitos.reduce((total, titulo) => total += titulo['FINANCEIROS_ABERTO'], 0);
    
                view.getViewModel().set({
                    observacoes: record.get('PESSOAS_OBSERVACOES'),
                    dataDebitosPessoa: debitos,
                    totalFormatado: Ext.util.Format.MoneyMask.setMask('R$ #9.999.990,00').mask(total)
                });

                this.getView().add(view);
            } else {
                this.checkEmail(record);
            }
        } else {
            this.checkEmail(record);
        }
    },

    checkEmail: function(record,) {
        const vm = this.getViewModel();
        const txtVendedor = this.lookup('vendedor');
        const gridItems = this.lookup('produtos');
        
        if(vm.get('isNotaEletronica')) {
            const txtEmail = this.lookup('email');

            if(!SamosUtils.String.isEmail(record.get('PESSOAS_EMAIL'))) {
                txtEmail.focus(true);
            } else if(configs.getMovimentos().carregaVendedor){
                Ext.defer(gridItems.focarNovoItem, 200, gridItems);
            } else {
                txtVendedor.focus(true);
            }
        } else if(vm.get('isNotaEntrada') || vm.get('isRequisicaoEntrada')) {
            const txtEmissao = this.lookup('emissao');
            txtEmissao.focus(true);
        } else if(vm.get('isPedidoCompra')) {
            const txtSeguroPercentual = this.lookup('seguropercentual');
            txtSeguroPercentual.focus(true);
        } else if(vm.get('isClientPrazo')) {
            const txtPrazo = this.lookup('prazo');
            txtPrazo.focus(true);
        } else if(configs.getMovimentos().carregaVendedor){
            Ext.defer(gridItems.focarNovoItem, 200, gridItems);
        } else {
            txtVendedor.focus(true);
        }
    },

    checkOperacao: function(){
        setTimeout(() => {
            const model = this.getRecord();            
            if(this.getViewModel().get('isNotaEletronica')){
                const txtOperacao = this.lookup('operacaonota');
                const simplesNacional = configs.getPermissao()['EMPRESAS_SIMPLES'] == 'T' ||
                                        configs.getPermissao()['EMPRESAS_SIMPLES'] == '0';
                const isExportacao = model.get('PESSOAS_CATEGORIA') == 3 && model.get('MOVIMENTOS_ID_OPERACOES') > 500000;
                const isContribuinte = model.get('PESSOAS_CATEGORIA') == 0 ||  // Contribuinte
                                       model.get('PESSOAS_CATEGORIA') == 3 ||  // Exportação
                                       model.get('PESSOAS_CATEGORIA') == 4;    // PJ Produtor rural
                const ufEmpresa = configs.getEmpresa().estado;
                const ufCliente = model.get('CIDADES_ESTADO');
                const interestadual = ufEmpresa != ufCliente;
                const isCpf = SamosUtils.String.isCpf(model.get('PESSOAS_CPFCNPJ')) || SamosUtils.String.isCpf(model.get('MOVIMENTOS_CPFCNPJ'));
                const oldOperacao = model.isNew() ? model.get('DOCUMENTOS_ID_OPERACOES') : model.get('MOVIMENTOS_ID_OPERACOES');
                const codPessoa = model.get('PESSOAS_ID');
                
                if(this.getViewModel().get('isNotaOzoniobras')) {
                    if(isContribuinte) {
                        model.set('MOVIMENTOS_SITUACAO', 'R');
                    } else {
                        model.set('MOVIMENTOS_SITUACAO', 'C');
                    }
                }

                let newOperacao;

                if(this.getViewModel().get('isNotaEletronica')){
                    if(configs.getClientName() == 'turbotec' && codPessoa == 900044 &&
                       oldOperacao.toString().slice(0, 4).match(/5101|6101/)) {
                        newOperacao = '692400';
                    } else if(configs.getClientName() == 'turbotec' && codPessoa == 350 &&
                       oldOperacao.toString().slice(0, 4).match(/5101|6101/)) {
                        newOperacao = '612400';
                    } else {
                        if(isExportacao) {
                            newOperacao = oldOperacao.toString().replace(/^\w/, 7);
                        } else {
                            if(isCpf && interestadual) {
                                if(isContribuinte) {
                                   newOperacao = 610200;
                                } else {
                                    if(oldOperacao.toString().slice(0, 4) == '5101') {
                                        newOperacao = 610700; // Ind
                                    } else {
                                        newOperacao = 610800; // Com
                                    }
                                }
                              } else if(interestadual){
                                  if(isContribuinte && oldOperacao.toString() == '610800'){
                                      newOperacao = 610200;
                                  }
                                  newOperacao = oldOperacao.toString().replace(/^\w/, 6);
                              } else {
                                  newOperacao = oldOperacao.toString().replace(/^\w/, 5);
                            }      
                        }    
                    }                    
                } else if(this.getViewModel().get('isNotaEntrada')){
                    if(isCpf && interestadual && simplesNacional) {
                        newOperacao = 120200;
                    } else if(interestadual){
                        newOperacao = oldOperacao.toString().replace(/^\w/, 2);
                    } else {
                        newOperacao = oldOperacao.toString().replace(/^\w/, 1);
                    }
                }
    
                if(model.isNew()) {
                    model.set('MOVIMENTOS_ID_OPERACOES', newOperacao);
                    txtOperacao.setValue(newOperacao);
                    txtOperacao.setSearchedId(newOperacao);
                    txtOperacao.onTextSearch(txtOperacao, {type: 'script'});    
                }
            }

            
            if(model.isNew() && (this.getViewModel().get('isPedido') || this.getViewModel().get('isOrcamento')) && configs.getClientName() == 'prudenmoveis'){
                const valorFreteUrb = (model.get('EMPRESAS_CNAE') || '').split('|')[0];
                const valorFreteSub = (model.get('EMPRESAS_CNAE') || '').split('|')[1];
                if(model.get('EMPRESAS_ID_CIDADES') == model.get('PESSOAS_ID_CIDADES')) {
                    model.set('MOVIMENTOS_ID_CUSTOS', 1);
                    if(model.get('CIDADES_STATUS') != 'P') {
                        model.set('MOVIMENTOS_FRETE', valorFreteUrb);
                    }
                } else {
                    model.set('MOVIMENTOS_ID_CUSTOS', 2);
                    if(model.get('CIDADES_STATUS') != 'P') {
                        model.set('MOVIMENTOS_FRETE', valorFreteSub);
                    }    
                }                
            }            

            if(this.getViewModel().get('isNotaEntrada') && configs.getMovimentos().pedidoCompraObrigatorio){
                const tema = configs.getTema(); 
                const txtEmpresaOrigem = this.lookup('empresaorigem');
                const txtNumeroOrigem = this.lookup('numeroorigem');
                const txtSerieOrigem = this.lookup('serieorigem');
        
                txtEmpresaOrigem.setValue(configs.getEmpresa().id);                
                txtNumeroOrigem.setReadOnly(false);
                txtSerieOrigem.setValue('CP');
                txtSerieOrigem.setReadOnly(false);
    
                txtNumeroOrigem.setUi('textbold-' + tema);
                txtSerieOrigem.setUi('textbold-' + tema);
            }
            
            if(this.getViewModel().get('isDevolucao')){
                const tema = configs.getTema(); 
                const txtEmpresaOrigem = this.lookup('empresaorigem');
                const txtNumeroOrigem = this.lookup('numeroorigem');
                const txtSerieOrigem = this.lookup('serieorigem');
        
                txtEmpresaOrigem.setFieldLabel('Empresa');
                txtEmpresaOrigem.setReadOnly(false);
                txtNumeroOrigem.setReadOnly(false);
                txtSerieOrigem.setValue('PED');
                txtSerieOrigem.setReadOnly(false);
    
                txtEmpresaOrigem.setUi('textbold-' + tema);
                txtNumeroOrigem.setUi('textbold-' + tema);
                txtSerieOrigem.setUi('textbold-' + tema);
            }
        }, 700);
    },
    
    onGravacaoSucesso: async function(movimentoNovo) {

        const contextoView = this.getView();
        const vm = this.getViewModel();
        const movimentosOriginais = vm.get('movimentosOriginais');

        Movimento.services.Recuperacao.apagar(movimentoNovo, Ext.NAVEGADOR_TAB_ID);

        if(vm.get('isNota')){
            Movimento.services.Model.updateUltimoDoctoNFE();

        } else if(vm.get('isDevolucao')){
            const txtEmpresaOrigem = this.lookup('empresaorigem');
            const txtNumeroOrigem = this.lookup('numeroorigem');
            const txtSerieOrigem = this.lookup('serieorigem');
    
            txtEmpresaOrigem.setFieldLabel('Origem');
            txtEmpresaOrigem.setReadOnly(true);
            txtNumeroOrigem.setReadOnly(true);
            txtSerieOrigem.setReadOnly(true);

            txtEmpresaOrigem.setUi('field-readonly');
            txtNumeroOrigem.setUi('field-readonly');
            txtSerieOrigem.setUi('field-readonly');
        }        

        if(movimentosOriginais && movimentoNovo.isNew() && movimentoNovo.get('MOVIMENTOS_NUMEROORIGEM')) {
            if(movimentosOriginais[0].get('DOCUMENTOS_NOME') == 'Ordem Serviço') {
                Movimento.services.ImportacaoExportacao.atualizarOriginalOS(movimentoNovo, movimentosOriginais, this);
            } else if(movimentosOriginais[0].get('DOCUMENTOS_NOME') == 'Transferências Saída'){
                Movimento.services.ImportacaoExportacao.atualizarTransferenciasEEmitirNotaEntrada(movimentoNovo, movimentosOriginais, this);
            } else {
                Movimento.services.ImportacaoExportacao.atualizarOriginais(movimentoNovo, movimentosOriginais, this);
            }
        } else {
            this.callParent(arguments);
        }

        const consultaValorRestante = await SamosUtils.Request.nodeApi({
            url: `/processos/executasql`,
            method: 'GET',
            query: {
                nomeSql: 'verifica_valorrestante',
                parametroSql: movimentoNovo.get('MOVIMENTOS_ID')     
            }
        }); 

        let valorRestanteSQL = 0;

        if(consultaValorRestante.results.length > 0) {
            valorRestanteSQL = cents(consultaValorRestante.results[0].VALORRESTANTE);
        }
        
        const valorMovimento   = cents(movimentoNovo.get('MOVIMENTOS_TOTAL')) - cents(movimentoNovo.get('MOVIMENTOS_VALORRETENCAO'));
        
        const geraNovoCaixa = movimentoNovo.get('OPERACOES_FINANCEIRO') != 'N' && valorRestanteSQL != valorMovimento;

        if( (vm.get('isNotaEletronica') || vm.get('isPedido') ) && geraNovoCaixa && !configs.getEmpresa().regimeCaixa ){
            movimentoNovo.set({'MOVIMENTOS_STATUS': 'N'});
            const thisController = this;
            thisController.getView().initGauge('Solicitando pagamento ...');

            Ext.defer( ()=>{
                if( Ext.$('formmovimentoscaixa').length == 0 ){
                    Ext.$('formmovimentos')[0].down('button[text="Pagamento"]').el.dom.click();
                }

                thisController.getView().stopGauge();
            }, 1000, this );
        }

        setTimeout(() => {
            const serie    = movimentoNovo.get('MOVIMENTOS_SERIE');
            const empresa  = configs.getEmpresa().id;
            const produtos = this.lookup('produtos').getStore().getData().items || [];

            produtos
                .filter(produto => cents(produto.get('MOVIMENTOSITENS_PRECO')) < cents(produto.get(configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO')))
                .forEach(produto => {
                    const idItem = produto.get('MOVIMENTOSITENS_ID');

                    SamosUtils.Request.nodeApi({
                        url: `/processos/gerarlog`,
                        method: 'POST',
                        query: {
                            senhaNivel: true,
                            log: `Preço a menor|MOVIMENTOSITENS|${empresa}|${idItem}|${serie}`
                        }
                    });
                });
                
            vm.set({
                hideParaPedido:                    vm.checkExportacao('PED', 'Pedidos'),
                hideParaDevolucao:                 vm.checkExportacao('DEV', 'Devoluções'),
                hideParaNotaEletronica:            vm.checkExportacao('NFE', 'Nota Eletrônica'),
                hideParaRequisicao:                vm.checkExportacao('REQ', 'Requisições'),
                hideParaRomaneioEntrega:           vm.checkExportacao('ENT', 'Romaneio Entrega'),
                hideParaRomaneioClienteRetirou:    (vm.checkExportacao('ENT', 'Romaneio Entrega') || configs.getClientName() != 'stilomoveis'),
                hideParaRomaneioEntregueOrcamento: (vm.checkExportacao('ENT', 'Romaneio Entrega') || configs.getClientName() != 'stilomoveis'),
                hideParaRomaneioMontagem:          vm.checkExportacao('MON', 'Romaneio Montagem')
            });
        
            if( vm.get('isNotaEletronica') ) {
                if( contextoView.depoisQueGravouNota ){
                    contextoView.depoisQueGravouNota.bind(contextoView.getController())(contextoView, vm.get('model') );
                }
            }

        }, 1000);
    },

    onGravacaoFalha: function (error) {
        if(error.error == 'Divergência'){
            this.iniciarEdicao();
            Ext.Note('warning', 'Há divergência entre os valores do movimento. Tente novamente.');
        } else {
            this.callParent(arguments);
        }
    },

    calcularTotaisCabecalho: function(txt) {
        if(txt && txt.readOnly){ return true; }
        this.iniciarEdicao();

        const vm = this.getViewModel();

        const deps = {
            ctrl: this,
            vm: vm,
            movimento: this.getRecord(), 
            txt: txt,
            txtPercentual: this.lookup('percentualdescontos'),
            txtDinheiro: this.lookup('rsdescontos'),
            txtTotalProdutos: this.lookup('total')
        }

        if(vm.get('isDescontoCabecalho') || vm.get('isDescontoPorItemECabecalho')) {
            Movimento.services.Descontos.cabecalho.calcularTotaisCabecalho(deps);
        }
    },

    validarLiquidoItem: async function(txt) {
        const deps = {
            griditems: this.lookup('produtos'),
            vm: this.getViewModel(),
            txt: txt,
            movimento: this.getRecord()
        }

        Ext.asap(async () => {
            await Movimento.services.Descontos.item.calcularDescontoEPercentualItens(deps, true, true);
        });
    },

    validarQtdeMaxima: function(txt, event) {
        if(txt.readOnly) { return; }

        const isOrcamento   = this.getViewModel().get('isOrcamento');
        const isNotaEntrada = this.getViewModel().get('isNotaEntrada');
        const produto       = txt.up('form').getForm().getValues();
        const id            = produto['MOVIMENTOSITENS_ID_PRODUTOS'];
        const qtde          = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);
        const qtdeMax       = grams(produto['QTDE_PROMOCAO']) || 0;

        if(configs.getClientName() == 'prudenmoveis' && isOrcamento && qtdeMax > 0) {
            if(qtde > qtdeMax) {
                Ext.Note('warning', `Produto: ${id} - Excede a quantidade máxima por cliente`, 4000);
                const nivel = 1;

                Ext.create({ xtype: 'samoswidgets-senhanivel' })
                    .iniciar(nivel)
                    .then(() => {
                        /*acao ao permitir*/
                    })
                    .catch(() => {
                        const form = txt.up('form').getForm();
                        if(form) {
                            const values = form.getValues();
                            values['MOVIMENTOSITENS_QUANTIDADE'] = (qtdeMax / 1000);
                            form.setValues(values);
                        }                
                    });
    
            }
        }

        if(configs.getMovimentos().avisarSaldoInsuficiente) {
            const saldoLocal = grams(produto['SALDOS_DISPONIVEL']);
            const saldoDeposito = grams(produto['SALDOS_DEPOSITO']);
            const operacaoEstoque = this.getViewModel().get('model.OPERACOES_ESTOQUE');
    
            if(qtde > (saldoLocal + saldoDeposito) && operacaoEstoque == 'D') {
                Ext.Note('warning', `Produto: ${id} - Saldo Insuficiente (Local: ${parseInt(saldoLocal / 1000)} / Depósito: ${parseInt(saldoDeposito / 1000)})`, 4000);
                const nivel = 1;
                Ext.create({ xtype: 'samoswidgets-senhanivel' })
                    .iniciar(nivel)
                    .then(() => {
                        // acao ao permitir
                    })
                    .catch(() => {
                        const form = txt.up('form').getForm();
                        if(form) {
                            const values = form.getValues();
                            values['MOVIMENTOSITENS_ID_PRODUTOS'] = 999999;
                            values['PRODUTOS_NOME']               = '';
                            values['MOVIMENTOSITENS_QUANTIDADE']  = 1;
                            values['MOVIMENTOSITENS_PRECO'] = 1;
                            form.setValues(values);
                        }                
                    });
            }

        }
    },

    analisarSituacao: function() {
        if(!configs.getMovimentos().sistemaDeAprovacao && !configs.getMovimentos().pedidoLP) {
            this.getViewModel().set('entregaValida', false);
        }
    },

    onConfirmacaodaOperacaoClick: async function() {
        const view  = this.getView();

        try {
            const model = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente manifestar a confirmação da Operação?')) {
                view.initGauge();

                const guidManifestar = SamosUtils.String.gerarGuid();            
                let processarEvento = await SamosUtils.Request.nodeApi({
                                        url: `/processos/movimentos/enviosefaztxt`,
                                        method: 'POST',
                                        data: {
                                            type  : 'processos',
                                            method: 'manifestar',
                                            evento: '0',
                                            id    : model.get('MOVIMENTOS_ID'),
                                            barras: model.get('MOVIMENTOS_NFE'),
                                            guid  : guidManifestar
                                        }
                                    });            

                Ext.Msg.alert('Informação', processarEvento[0].data.status);
                
                const data = {
                    'MOVIMENTOS_STATUS': ((configs.getEmpresa().cnpj.substring(0, 8) != '04395395' &&
                                           configs.getEmpresa().cnpj.substring(0, 8) != '45118377') ? 'F' : 'H'), // Se for margarida ou eduardo tem um passo a mais, transferir (H)
                    'MOVIMENTOS_LOG': SamosUtils.Info.getLog()
                };
    
                model.set(data);
    
                await SamosUtils.Request.nodeApi({
                    url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: data
                });

                this.getListView().getController().onBuscarClick();
                Ext.Note('success', 'Nota manifestada com sucesso');
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao manifestar');
        }

        view.stopGauge();
    },

    onDesconhecimentodaOperacaoClick: async function() {
        const view  = this.getView();

        try {
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(1); 
        } catch(error) { 
            Ext.Note('warning', 'Manifestação não autorizada');
            return;   
        }

        try {
            const model = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente manifestar o desconhecimento da Operação?')) {
                view.initGauge();

                const guidManifestar = SamosUtils.String.gerarGuid();            
                let processarEvento = await SamosUtils.Request.nodeApi({
                                        url: `/processos/movimentos/enviosefaztxt`,
                                        method: 'POST',
                                        data: {
                                            type  : 'processos',
                                            method: 'manifestar',
                                            evento: '1',  // Desconhecimento
                                            id    : model.get('MOVIMENTOS_ID'),
                                            barras: model.get('MOVIMENTOS_NFE'),
                                            guid  : guidManifestar
                                        }
                                    });            

                Ext.Msg.alert('Informação', processarEvento[0].data.status);
                
                const data = {
                    'MOVIMENTOS_STATUS': ((configs.getEmpresa().cnpj.substring(0, 8) != '04395395' &&
                                           configs.getEmpresa().cnpj.substring(0, 8) != '45118377') ? 'F' : 'H'), // Se for margarida ou eduardo tem um passo a mais, transferir (H)
                    'MOVIMENTOS_LOG': SamosUtils.Info.getLog()
                };
    
                model.set(data);
    
                await SamosUtils.Request.nodeApi({
                    url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: data
                });

                this.getListView().getController().onBuscarClick();
                Ext.Note('success', 'Nota manifestada com sucesso');
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao manifestar');
        }

        view.stopGauge();
    },

    onOperacaoNaoRealizadaClick: async function() {
        const view  = this.getView();

        try {
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(1); 
        } catch(error) { 
            Ext.Note('warning', 'Manifestação não autorizada');
            return;   
        }

        try {
            const model = this.getRecord();

            if(await SamosUtils.Msg.confirm('Deseja realmente manifestar que a Operação não foi realizada?')) {
                view.initGauge();

                const guidManifestar = SamosUtils.String.gerarGuid();            
                let processarEvento = await SamosUtils.Request.nodeApi({
                                        url: `/processos/movimentos/enviosefaztxt`,
                                        method: 'POST',
                                        data: {
                                            type  : 'processos',
                                            method: 'manifestar',
                                            evento: '2',  // Operação não realizada
                                            id    : model.get('MOVIMENTOS_ID'),
                                            barras: model.get('MOVIMENTOS_NFE'),
                                            guid  : guidManifestar
                                        }
                                    });
            
                Ext.Msg.alert('Informação', processarEvento[0].data.status);
                
                const data = {
                    'MOVIMENTOS_STATUS': ((configs.getEmpresa().cnpj.substring(0, 8) != '04395395' &&
                                           configs.getEmpresa().cnpj.substring(0, 8) != '45118377') ? 'F' : 'H'), // Se for margarida ou eduardo tem um passo a mais, transferir (H)
                    'MOVIMENTOS_LOG': SamosUtils.Info.getLog()
                };
    
                model.set(data);
    
                await SamosUtils.Request.nodeApi({
                    url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: data
                });

                this.getListView().getController().onBuscarClick();
                Ext.Note('success', 'Nota manifestada com sucesso');
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao manifestar');
        }

        view.stopGauge();
    },

    onDetalhesProdutoClick: async function(item) {
        const view = this.getView();
        
        try {
            view.initGauge();
    
            const queryProduto = await SamosUtils.Request.nodeApi({
                url: `/produtos`,
                method: 'GET',
                data: {
                    empresa: configs.getEmpresa().id,
                    conteudo: `.${item.get('MOVIMENTOSITENS_ID_PRODUTOS')}`,
                    ordem: 2,
                    status: '',
                    start: 0,
                    limit: 1
                }
            })

            const produto = Ext.create('SamosAdmin.atualizacao.produtos.Model', Object.assign({}, queryProduto.results[0]));

            const janelaSaldos = Ext.create({
                xtype: 'formprecossaldos'
            });

            produto.data['SALDOS'] = produto.data['SALDOSGERAL'];
    
            if(
                !configs.getUsuario().privilegiado &&
                configs.getProdutos().exibirSaldoApenasLocalEDeposito
            ) {
                //so ve da propria empresa e do deposito, com saldo maximo 10
                produto.data['SALDOS'] = (produto.data['SALDOS'] || []).filter(saldo => {
                    if(
                        (saldo['EMPRESAS_ID'] == configs.getEmpresa().id) || 
                        (saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i)
                    ) {
                        if((saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i)){
                            saldo['SALDOS_DISPONIVEL'] = saldo['SALDOS_DISPONIVEL'] > 10 ? 10 : saldo['SALDOS_DISPONIVEL'];
                        }
                        return true;
                    } else {
                        return false;
                    };
                });
            }
    
            janelaSaldos.getViewModel().set({
                model: produto
            });
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao exibir detalhes do produto');
        }
        
        view.stopGauge();
    },

    gerarFinanceiroCompra: function() {
        const form = Ext.$('formmovimentos')[0] || [];

        if(
            form.getViewModel().get('isPedidoCompra') || 
            form.getViewModel().get('isPreVendaPrazo') || 
            form.getViewModel().get('isOrcamentoPrazo')
        ){
            const grid = form.lookup('financeiroscompra');
            const movimento = form.getViewModel().get('model');
            const parcelas = movimento.get('PRAZOS_PARCELAS');
            let parcelamento = movimento.get('PRAZOS_PARCELAMENTO') ? movimento.get('PRAZOS_PARCELAMENTO').split('#').filter(n => parseInt(n).toString() != 'NaN') : undefined;
            const valorFinanceiro = cents(movimento.get('MOVIMENTOS_TOTAL'));

            grid.removeAllItems();
            grid.removerLinhasEmBranco();
    
            if(!parcelamento) {
                parcelamento = [];
                for (let i = 0; i < parcelas; i++) {
                    parcelamento.push(i * 30);
                }
            }

            const resto = valorFinanceiro % parcelamento.length;            
    
            const dataFinanceiro = parcelamento.map((days, index) => {
                const vcto = momentServer().add(days, 'days');
    
                const original = cents(parseInt(valorFinanceiro / parcelas) / 100) + (index === 0 ? resto: 0);
    
                return Ext.create('SamosAdmin.movimentos.movimento.ModelCompra', {
                    'MOVIMENTOSFINANCEIROSCOMPRA_ID'           : (index + 1) * -1, 
                    'MOVIMENTOSFINANCEIROSCOMPRA_ID_MOVIMENTOS': movimento.get('MOVIMENTOS_ID'), 
                    'MOVIMENTOSFINANCEIROSCOMPRA_VCTO'         : vcto.format('YYYY-MM-DD'),
                    'MOVIMENTOSFINANCEIROSCOMPRA_VALOR'        : (original / 100) || 0
                }).data;
            });

            this.getViewModel().set('model.MOVIMENTOS_FINANCEIROSCOMPRA', dataFinanceiro)
        }
    },

    checarHerbicidas: async function(storeProdutos) {

        const hasHerbicidas = storeProdutos.data.items.filter(produto => (produto.get('PRODUTOS_ID_GRUPOS') == 2 || (produto.get('PRODUTOS_ID_GRUPOS') == 7)));
        const hasTriEspecial = storeProdutos.data.items.filter(produto => produto.get('SALDOS_EXCECAO') == '2');
        const hasReceituario = storeProdutos.data.items.filter(produto => produto.get('PRODUTOS_LISTAPRECO') == 'T');

        if(hasHerbicidas.length > 0 && 
           hasTriEspecial.length > 0 && 
           hasReceituario.length > 0) {
            Ext.Msg.alert('Atenção', `Há Herbicidas, que precisam de receituário e Produtos Isentos (para PRPJSP) nesta venda`);
        } else {
            if(hasReceituario.length > 0) {
                Ext.Msg.alert('Atenção', `Há produtos que precisam de receituário nesta venda`);
            } else {
                if(hasHerbicidas.length > 0) {
                    Ext.Msg.alert('Atenção', `Há Herbicidas nesta venda`);
                } else {
                    if(hasTriEspecial.length > 0) {
                        Ext.Msg.alert('Atenção', `Há produtos Isentos de ICMS para PRPJ - Checar se categoria pessoa está correta`);
                    }        
                }
            }
        }
    },

    temDuplicados: async function(itensProduto) {

        let listaProdutos = [];

        itensProduto.forEach(produto => {
            if(listaProdutos.indexOf(produto.get('MOVIMENTOSITENS_ID_PRODUTOS')) == -1) {
                listaProdutos.push(produto.get('MOVIMENTOSITENS_ID_PRODUTOS'));
            }
        });

        if(itensProduto.length != listaProdutos.length) {
            Ext.Note('warning', 'Não é permitido lançar duas ou mais vezes o mesmo código de produto');
            return true;
        };

        return false;
    },

    onProdutosClick: function(btn, e) {
        this.iniciarEdicao();

        const movimento = this.getRecord();
        const produtosAtuais = this.lookup('produtos').getStore().data.items;
        
        btn.up('samoswidgets-dinamicbutton').openSearch({
            title: 'Produtos',
            tabela: 'produtos',
            proximoFoco: 'nome',
            multi: true,
            valueOrdem: 1,
            valueStatus: movimento.get('MOVIMENTOS_SITUACAO') == 'A' ? 'A' : 'T' // Assistência ou ativos
        })
        .then(records => {
            const produtos = records.map(produto => {
                const preco = cents(produto.get('SALDOS_COMPRA'));
                const peripi = cents(movimento.get('PERCENTUAL_IPI'));
                const perfrete = cents(movimento.get('PERCENTUAL_FRETE'));
                const perseguro = cents(movimento.get('PERCENTUAL_SEGURO'));

                return Ext.create('SamosAdmin.movimentos.movimento.ModelItens', {
                    'MOVIMENTOSITENS_ID'             : '',
                    'MOVIMENTOSITENS_ID_MOVIMENTOS'  : '',
                    'MOVIMENTOSITENS_ID_PRODUTOS'    : produto.get('PRODUTOS_ID'),
                    'PRODUTOS_STATUS'                : produto.get('PRODUTOS_STATUS'),
                    'PRODUTOS_NOME'                  : produto.get('PRODUTOS_NOME'),
                    'PRODUTOS_UNIDADE'               : produto.get('PRODUTOS_UNIDADE'),
                    'PRODUTOS_MARCA'                 : produto.get('PRODUTOS_MARCA'),
                    'PRODUTOS_DERIVADO'              : produto.get('PRODUTOS_DERIVADO'),
                    'PRODUTOS_APLICACAO'             : produto.get('PRODUTOS_APLICACAO'),
                    'PRODUTOS_UNIDADE'               : produto.get('PRODUTOS_UNIDADE'),
                    'MOVIMENTOSITENS_IPI'            : peripi / 100,
                    'MOVIMENTOSITENS_VALORIPI'       : ((preco * peripi) / 1000000),
                    'MOVIMENTOSITENS_ALIQUOTAPIS'    : perfrete / 100,
                    'MOVIMENTOSITENS_FRETE'          : ((preco * perfrete) / 1000000),
                    'MOVIMENTOSITENS_ALIQUOTACOFINS' : perseguro / 100,
                    'MOVIMENTOSITENS_SEGURO'         : configs.getMovimentos().usarMarkup ? 0 : ((preco * perseguro) / 1000000),
                    'MOVIMENTOSITENS_PRECO'          : preco / 100,
                    'MOVIMENTOSITENS_CUSTO'          : preco / 100,
                    'MOVIMENTOSITENS_TOTAL'          : preco / 100,
                    'SALDOS_PRECOMINIMO'             : preco / 100,
                    'PRECOMINIMO_DB'                 : preco / 100,
                    'SALDOS_PRECO'                   : preco / 100,
                    'SALDOS_CUSTO'                   : preco / 100,
                    'VALOR_LIQUIDO'                  : preco / 100,                    
                    'TOTAL_LIQUIDO'                  : preco / 100,
                    'MOVIMENTOSITENS_QUANTIDADE'     : 1
                });
            });
            this.getViewModel().get('model').set({
                'MOVIMENTOS_ITENS': produtosAtuais.concat(produtos)
            });
            Ext.defer(this.onFecharClick, 200, this);
        })
    },

    validarPessoaPrudenmoveis: function() {  // Filtros tipos pessoa Prudenmóveis
        const movimento = this.getRecord();
        const idDocumento = movimento.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-2);
        const tipoPessoa = movimento.get('PESSOAS_TIPO');
        const idPessoa = movimento.get('MOVIMENTOS_ID_PESSOAS');
        const idEmpresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

        if(idDocumento == '01' || idDocumento == '02') {  // Orçamento e pedido
           if(tipoPessoa != 'A' && tipoPessoa != 'U') {   // Apenas clientes e empresas
               return false
           }
        }

        if(idDocumento == '05' || idDocumento == '06') {// Nota de entrada e pedido de compra
            if(tipoPessoa != 'B' && // Fornecedores
               tipoPessoa != 'D' && // Transportadoras
               tipoPessoa != 'R' && // Consumos               
               tipoPessoa != 'T' && // Assessorias               
               tipoPessoa != 'E') { // Despesas.
                return false
            }
         } 

         if(idDocumento == '16' || idDocumento == '07') {// TRE ou TRS
            if(tipoPessoa != 'U' || (idPessoa == idEmpresa)) { // Só empresas, e não pode ser a mesma ori/des
                return false
            }
         } 

        return true;
    },

    checarEntregaPrudenmoveis: async function() {  // Limites de valores de entrega
        const movimento = this.getRecord();
        const vm = this.getViewModel();
        const idDocumento = movimento.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-2);
        const tipoFrete = this.lookupReference('entrega').getValue();

        if(idDocumento != '01' && idDocumento != '02') {  // Checa somente orçamentos e pedidos
            return '';
        }
       
        const valorMovimento = cents(movimento.get('MOVIMENTOS_TOTAL')) - cents(movimento.get('MOVIMENTOS_FRETE'));
        const minimoUrb = cents(movimento.get('EMPRESAS_CNAE').split('|')[3]);
        const minimoSub = cents(movimento.get('EMPRESAS_CNAE').split('|')[4]);
        const munEmpresa = cents(movimento.get('EMPRESAS_ID_CIDADES'));
        const munPessoa = cents(movimento.get('PESSOAS_ID_CIDADES'));
        const isSuburbano = (tipoFrete == 2) || (munEmpresa > 0 && munPessoa > 0 && munEmpresa != munPessoa)

        if((valorMovimento + minimoUrb + minimoSub) == 0) {
            return '';
        }

        if(isSuburbano && valorMovimento < minimoSub) {
            return 'A'
        } else {
            if(valorMovimento < minimoUrb) {
                return 'A'
            }
        }

        return '';
    },

    validarPessoaAcomtf: function() {  // Filtros tipos pessoa AçoMTF
        const movimento = this.getRecord();
        const idDocumento = movimento.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-2);
        const tipoPessoa = movimento.get('PESSOAS_TIPO');
        const idPessoa = movimento.get('MOVIMENTOS_ID_PESSOAS');
        const idEmpresa = movimento.get('MOVIMENTOS_ID_EMPRESAS');

        if(idDocumento == '01' || idDocumento == '02') {  // Orçamento e pedido
           if(tipoPessoa != 'A') {   // Apenas clientes
               return false
           }
        }

        return true;
    },

    validarPropriedadeMovimento: function() {
        const movimento = this.getRecord();
        const idPessoa = parseInt(movimento.get('MOVIMENTOS_ID_PESSOAS'));
        const idPropriedade = parseInt(movimento.get('MOVIMENTOS_ID_PROPRIEDADES'));
        const idPessoaPropriedade = parseInt(movimento.get('PROPRIEDADES_ID_PESSOAS') || 0);

        if(idPropriedade > 0 && idPessoa != idPessoaPropriedade) {
            return false
        }

        return true;
    },

    validarPrecos: function() {
        const movimento = this.getRecord();

        const semPreco = (movimento.get('MOVIMENTOS_ITENS') || []).some(item => {
            return !item['MOVIMENTOSITENS_PRECO']
        });


        return semPreco;
    },

    validarPessoaRequisicao: function() {
        const movimento = this.getRecord();
        const idPessoaMovimento = movimento.get('MOVIMENTOS_ID_PESSOAS');
        const idPessoaRequisicao = movimento.get('PESSOAS_IDREQUISICAO');

        if(idPessoaRequisicao && idPessoaMovimento && idPessoaMovimento != idPessoaRequisicao) {  // Se não for do mesmo fornecedor
            Ext.Note('warning', 'Requisição de fornecedor diferente da nota, corrigir', 4000)
            return false
        }

        return true;
    },

    validaAberturaJanelaDetalhes: function (produto) {
        const isNotaEletronica = this.getViewModel().get('isNotaEletronica');

        if(produto.get('MOVIMENTOSITENS_ID_PRODUTOS') == 999999 && 
           configs.getClientName() != 'prudenmoveis') {
            Ext.Note('warning', 'Informe código correto do produto antes de ver detalhes');
            return false;
        }

        if((configs.getClientName() == 'biomart' || 
            configs.getClientName() == 'organoplant') && isNotaEletronica) {
            const produtoDeProducao = produto.get('PRODUTOS_STATUS') == 'P';
/*            if(!produtoDeProducao) {
                Ext.Note('warning', 'Não é produto de produção');
                return false;
            } else { */
                return true;
//            }
        } else { 
            return true;
        }
    },

    onParciaisClick: function(btn, e){
        const view = this.getView(),
              vm   = this.getViewModel();

        const janelaParciais = Ext.create('SamosAdmin.movimentos.movimento.form.baixaparcialpedido.View');
        janelaParciais.show();
        view.initGauge('Carregando');
        janelaParciais.initGauge('Carregando');

        Ext.defer( async ()=>{
            janelaParciais.valorTotalMovimento = vm.get('model').get('MOVIMENTOS_TOTAL');
            janelaParciais.getController().calcularSaldorRestante();

            janelaParciais.updateCallback = function(){
                janelaParciais.getController().calcularSaldorRestante( janelaParciais.lookupReference('valorbaixa').getValue() );
            }
            janelaParciais.updateCallback.bind( janelaParciais.getController() );

            //Atualiza a todo o momento o saldo restante ao digitar no campo
            janelaParciais.el.dom.addEventListener('keydown', janelaParciais.updateCallback);
            janelaParciais.el.dom.addEventListener('keyup',   janelaParciais.updateCallback);
            
            janelaParciais.getController().onAfterConstructor(janelaParciais);

            view.stopGauge();
            janelaParciais.stopGauge();
        }, 400, this );
    },

    gerarNossoNumero: async function(ids, portador) {
        let progress;
        try {
            const empresa  = configs.getEmpresa().id;

            const tempoPorBoleto = 250;//ms
            const tempoEstimado  = (tempoPorBoleto * (ids.length || 1)) + 500;
            
            progress = Ext.Progress(tempoEstimado, 'Gerando Nosso Número');
        
            const guidBoleto = SamosUtils.String.gerarGuid();
            await SamosUtils.Request.nodeApi({
                url: `/processos/financeiros/enviofinanceirotxt`,
                method: 'POST',
                data: {
                    task    : 'boletos',
                    empresa : empresa,
                    portador: portador,
                    ids     : ids,
                    guid    : guidBoleto
                }
            });

            clearInterval(progress);
            Ext.MessageBox.hide();
    
        } catch(error){ 
            clearInterval(progress);
            Ext.MessageBox.hide();  
            throw error;
        }
    },

    onAlterarEmissaoClick: function(btn, e) {
        const movimento = this.getRecord();

        const win = Ext.create({
            xtype: 'window',
            title: 'Alterar Emissão',
            autoShow: true,
            width: 200,
            heigth: 300,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'datefield',
                    fieldLabel: 'Nova Emissão',
/*                    readOnly: true,
                    ui: 'field-readonly',*/
                    value: momentServer().format('YYYY-MM-DD')
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'button',
                            text: 'Gravar',
                            margin: '10 7 7 7',
                            ui: `primary-${configs.getTema()}`,
                            handler: gravar
                        },
                        {
                            xtype: 'button',
                            text: 'Cancelar',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                }
            ]
        });

        async function gravar() {
            try {
               
                win.initGauge();

                const novaEmissao = moment(win.down('datefield').getValue()).format('YYYY-MM-DD');

                if(momentTz(novaEmissao).isBefore(momentServer().startOf('month').format('YYYY-MM-DD')) && configs.getClientName() != 'prudenart') {
                    Ext.Note('warning', 'Data anterior à permitida');
                    win.stopGauge(true);                    
                    return;
                }

                if(momentTz(novaEmissao).isAfter(momentServer().endOf('month').format('YYYY-MM-DD'))) {
                    Ext.Note('warning', 'Data posterior à permitida');
                    win.stopGauge(true);                    
                    return;
                }                

                await SamosUtils.Request.nodeApi({
                    url: `/processos/movimentos/alteraremissao/${movimento.get('MOVIMENTOS_ID')}`,
                    method: 'PUT',
                    data: {
                        'MOVIMENTOS_EMISSAO': novaEmissao
                    },
                    query: {
                        senhaNivel: true
                    }
                });

                Ext.Note('success', 'Emissão alterada com sucesso');

                movimento.set('MOVIMENTOS_EMISSAO', novaEmissao);

                win.destroy();
            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao alterar data da emissão');
            }
        }
    },

    onAjusteDataPDFClick: function(btn, e) {
        const movimento = this.getRecord();

        const win = Ext.create({
            xtype: 'window',
            title: 'Pdf Emissão Ajustada',
            autoShow: true,
            width: 250,
            heigth: 300,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'datefield',
                    fieldLabel: 'Data Emissão',
                    value: momentServer().format('YYYY-MM-DD')
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'button',
                            text: 'Emitir',
                            margin: '10 7 7 7',
                            ui: `primary-${configs.getTema()}`,
                            handler: emitir
                        },
                        {
                            xtype: 'button',
                            text: 'Cancelar',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                }
            ]
        });

        async function emitir() {
            try {
               
                const novaEmissao = moment(win.down('datefield').getValue()).format('YYYY-MM-DD');
// igualando...
                win.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/pedidostilo`,
                    method: 'GET',
                    query: {
                        id               : movimento.get('MOVIMENTOS_ID'),
                        numero           : movimento.get('MOVIMENTOS_NUMERO'),
                        empresa          : configs.getEmpresa().id,
                        empresacnpj      : configs.getEmpresa().cnpj,
                        empresanome      : configs.getEmpresa().nome,        
                        documento        : movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
                        start            : 0,
                        limit            : 1,
                        titledocumento   : 'PEDIDO',
                        emissaoretroativa: novaEmissao
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
// fim do igualado
                win.destroy();
            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao imprimir com data retroativa');
            }
        }
    },

    onAlterarVendedorClick: function(btn, e) {
        const movimento = this.getRecord();

        const win = Ext.create({
            xtype: 'window',
            title: 'Alterar Vendedor',
            autoShow: true,
            width: 200,
            heigth: 300,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'numberfield',
                    enableKeyEvents: true,
                    hideTrigger: true,
                    fieldStyle: 'text-align: right;',
                    reference: 'novoVendedor',
                    fieldLabel: 'Novo Vendedor',
                    minValue: 1,
                    allowDecimals: false,
                },
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'button',
                            text: 'Gravar',
                            margin: '10 7 7 7',
                            ui: `primary-${configs.getTema()}`,
                            handler: gravar
                        },
                        {
                            xtype: 'button',
                            text: 'Cancelar',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                }
            ]
        });

        async function gravar() {
            try {
                win.initGauge();

                const novoVendedor = win.down('numberfield').getValue();

                const searchVendedor = await SamosUtils.Request.nodeApi({
                    url: `/usuarios`,
                    method: 'GET',
                    query: {
                        conteudo: '.' + novoVendedor
                    }
                });

                if(searchVendedor.results.length > 0) {
                    await SamosUtils.Request.nodeApi({
                        url: `/processos/movimentos/alterarvendedor/${movimento.get('MOVIMENTOS_ID')}`,
                        method: 'PUT',
                        data: {
                            'MOVIMENTOS_ID_USUARIOS': novoVendedor
                        }
                    });
    
                    Ext.Note('success', 'Vendedor alterado com sucesso');
    
                    const nomeVendedor = searchVendedor.results[0]['USUARIOS_NOME'] || '';

                    movimento.set('MOVIMENTOS_ID_USUARIOS', novoVendedor);    
                    movimento.set('USUARIOS_NOME', nomeVendedor);    
                    
                    win.destroy();

                }

            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao alterar Vendedor');
            }
        }
    },

    mostrarObsPessoa: async function(orcamento) {
        
        const win = Ext.create({
            xtype: 'window',
            title: 'Pessoa: ' + orcamento.get('PESSOAS_ID') + ' - ' + orcamento.get('PESSOAS_NOME'),
            autoShow: true,
            width: 700,
            heigth: 250,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            bodyPadding: 10,
            items: [
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        style : 'background-color: red;',
                        pack: 'center'
                    },
                    items: [
                        {
                            height: 100,
                            xtype: 'textarea',
                            style : 'background-color: red;',
                            reference: 'observacoes',
                            fieldLabel: 'Observações',
                            labelStyle: 'color: white; font-weight: bold;',                            
                            proximoFoco: 'credito',
                            maxLength: 512,
                            value: orcamento.get('PESSOAS_OBSERVACOES'),
                            readOnly: true,
                            anchor: '100%',
                            grow  : true,
                            width : '100%'
                        }
                    ]
                },            
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            flex: 1,
                            fieldLabel: 'Alterado/Incluído por',
                            labelStyle: 'color: white; font-weight: bold;',
                            reference: 'usuarioeditor',
                            xtype: 'textfield',
                            style : 'background-color: red;',                            
                            readOnly: true,                            
                            value: orcamento.get('PESSOAS_LOG')
                        }
                    ]
                }, 
                {
                    xtype: 'container',
                    layout: {
                        type: 'hbox',
                        align: 'center',
                        pack: 'center'
                    },
                    items: [
                        {
                            xtype: 'button',
                            text: 'Fechar',
                            reference: 'btnsair',
                            margin: '10 7 7 0',
                            ui: `tertiary-${configs.getTema()}`,
                            handler: function() {
                                win.destroy();
                            }
                        }
                    ]
                }
            ]
        });
    },

//

    obterNumeroComanda: function() {
        return new Promise(resolve => {
            const win = Ext.create({
                xtype: 'window',
                title: 'Informe a Comanda',
                autoShow: true,
                width: 200,
                heigth: 300,
                layout: {
                    type: 'vbox',
                    align: 'stretch'
                },
                bodyPadding: 10,
                items: [
                    {
                        xtype: 'numberfield',
                        enableKeyEvents: true,
                        hideTrigger: true,
                        fieldStyle: 'text-align: right;',
                        reference: 'novoVendedor',
                        fieldLabel: 'Código',
                        minValue: 1,
                        allowDecimals: false,
                    },
                    {
                        xtype: 'container',
                        layout: {
                            type: 'hbox',
                            align: 'center',
                            pack: 'center'
                        },
                        items: [
                            {
                                xtype: 'button',
                                text: 'Confirmar',
                                margin: '10 7 7 7',
                                ui: `primary-${configs.getTema()}`,
                                handler: () => {
                                    resolve(win.down('numberfield').getValue());
                                    win.destroy();
                                }
                            }
                        ]
                    }
                ]
            });
        })
    }
});

