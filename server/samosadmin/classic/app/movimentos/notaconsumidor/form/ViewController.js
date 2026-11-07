Ext.define('SamosAdmin.movimentos.notaconsumidor.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formnotaconsumidor',

    mixins: {
        cartoes:  'SamosAdmin.movimentos.notaconsumidor.form.caixa.cartoes.Mixin',
        produtos: 'SamosAdmin.movimentos.notaconsumidor.form.mixins.Produtos',
        status:   'SamosAdmin.movimentos.notaconsumidor.form.mixins.Status'
    },

    onAfterConstructor: async function(){
        
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

            const result = NotaConsumidor.calculos.RecalculoSync.calcular({
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

                const resultAtualizado = NotaConsumidor.calculos.RecalculoSync.calcular(options);

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
            await this.callParent(arguments);
            await NotaConsumidor.services.Model.definirValoresPadrao(view, nomeDocumento);
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível incluir um novo movimento');
        }

        this.lookup('pessoa').focus(true);        

        return view;
    },

    onExportarClick: Ext.emptyFn,

    onParaNotaEletronicaClick: function(itemMenu, e) {
        const model = this.getRecord();
        const form = this.getView();
        const list = this.getListView();

        //Passa o nfc para dentro do propio form, pra poder enviar como parametro na hora de exportar
        form.nfcNota = model.get('MOVIMENTOS_NFE');

        NotaConsumidor.services.ImportacaoExportacao.paraNotaEletronica(form, list);
    },

    /**Função para atualizar o campo LOG apos gravar */
    atualizarLog: async function( modelParam ){
        const view  = this.getView(),
              vm    = this.getViewModel();

        Ext.defer( async()=>{
            view.lookupReference('log').setValue( modelParam.get('MOVIMENTOS_LOG') );

        }, 200, this );
    },

    onAlterarClick: function (btn, event) {
        const form    = this.getView();
        const model   = this.getRecord();
        const id      = model.get('MOVIMENTOS_ID');
        const numero  = model.get('MOVIMENTOS_NUMERO');
        const serie   = model.get('MOVIMENTOS_SERIE');
        const empresa = model.get('MOVIMENTOS_ID_EMPRESAS');

        model.getProxy().setExtraParam('log', `PUT /notaconsumidor/${id} (${numero}|${serie}|${empresa})`);
        NotaConsumidor.services.Model.bloquearParaEdicao(model, form);

        //ajusta para pegar padrão como digitado em dinheiro
        const tipoDesconto = model.get('DOCUMENTOS_DESCONTOITEM');
        const digitouDescontoCabecalho = tipoDesconto == 'F' || tipoDesconto == 'A';

        form.getViewModel().set({
            digitouDescontoCabecalho:             digitouDescontoCabecalho,
            digitouDescontoCabecalhoEmDinheiro:   digitouDescontoCabecalho,
            digitouDescontoCabecalhoEmPercentual: false,
            digitouDescontoItem:                  tipoDesconto == 'T'
        });

        NotaConsumidor.services.Documento.checkVendaConsumidor(this.getView());

        this.callParent(arguments);
    },

    onCancelarClick: async function(btn, event) {
        Ext.Msg.confirmCancel(btn => {
            if (btn == 'yes') {
                this.cancelar();
            }
        });

    },

    cancelar: async function() {
        const view = this.getView();
        const vm = this.getViewModel();
        const model = this.getRecord();
        const previousModel = this.getViewModel().get('previousModel');

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
                NotaConsumidor.services.Model.liberarParaEdicao(model, view);

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

        if(!this.permiteExclusao && !configs.getUsuario().privilegiado){
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

                    model.getProxy().setExtraParam('log', `DELETE /notaconsumidor/${id} (${numero}|${serie}|${empresa})`);
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
        const vm = this.getViewModel();

        view.initGauge('Gravando...');

        await SamosUtils.Utils.sleep(100);
        view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        if(cents(view.model.get('MOVIMENTOS_TOTAL')) > 1000000) {
            Ext.Note('warning', 'O valor da nota consumidor não pode exceder R$ 10.000,00;');
            view.stopGauge(true);
            return;
        }

        try {
            await this.validarCabecalho();
            const valido = NotaConsumidor.services.Caixa.validarReceber();

            if(valido){
                await NotaConsumidor.services.Impostos.calcular(view);
                this.checarValoresCabecalho(view);
                this.finalizarEdicao();
            } else {
                return
            }

            const movimento = this.getRecord();

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

            movimento.set('MOVIMENTOS_STATUS', status);

            this.colocarFilhosNoModel(movimento);

            if(
                NotaConsumidor.services.Caixa.financeiroValido()
            ) {
                movimento.set({
                    'MOVIMENTOS_LOG': SamosUtils.Info.getLog(),
                    'MOVIMENTOS_STATUS': 'F'
                });

                const btnCaixa = view.down('button[text="Caixa"]');

                if(btnCaixa) {
                    btnCaixa.getEl().dom.style.backgroundColor = '';
                    btnCaixa.getEl().dom.querySelector('.x-btn-inner').style.color = '';
                }

                const temEntradaSaida = momentTz(movimento.get('MOVIMENTOS_ENTRADASAIDA') || '1899-12-30').isAfter('1900-01-01');

                if(!temEntradaSaida) {
                    movimento.set('MOVIMENTOS_ENTRADASAIDA', momentServer().format('YYYY-MM-DD'));
                }
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

            const movimentoSalvo = await movimento.save();
            
            this.onGravacaoSucesso(movimentoSalvo);

        } catch(error) {
            console.error(error)
            if(error && error.error == 'Divergência'){
                this.iniciarEdicao();
                error = 'Há divergência entre os valores do movimento. Tente novamente.';
            }

            SamosUtils.Msg.error(error, 'Falha ao gravar');
            view.stopGauge();
            throw error;
        }

        SamosUtils.Events.disableWarnReload();
    },

    onVisualizarClick: async function(btn, e){
        const view = this.getView();
        const vm = view.getViewModel();
        const model = this.getRecord();

        try {
    
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/docsfiscais/${configs.getClientName()}/danfc`,
                method: 'GET',
                query: {
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
            SamosUtils.Msg.error(error, 'Erro ao Visualizar');
        }

        view.stopGauge()
    },

    onSefazClick: Ext.emptyFn,

    onEmitirClick: async function(btn, e){
        const view = this.getView(),
              vm   = this.getViewModel(),
              model = vm.get('model');

        const idEmpresa       = model.get('MOVIMENTOS_ID_EMPRESAS');
        const idMovimento     = model.get('MOVIMENTOS_ID');  
        const statusMovimento = model.get('MOVIMENTOS_STATUS');

        if( !await SamosUtils.Msg.confirm('Deseja realmente emitir?') ){
            return;
        }

        view.initGauge('Emitindo nota consumidor, aguarde...');

        let guidSefaz = SamosUtils.String.gerarGuid();
        let querySefaz;

        if(model.get('MOVIMENTOS_PROTOCOLO') == '') {
            querySefaz = await SamosUtils.Request.nodeApi({
                url: `/processos/movimentos/enviosefaztxt`,
                method: 'POST',
                data: {
                    type  : 'notaconsumidor',
                    method: 'enviar',
                    id    : idMovimento,
                    guid  : guidSefaz
                }
            });
        } else {
            querySefaz = await SamosUtils.Request.nodeApi({
                url: `/processos/movimentos/enviosefaztxt`,
                method: 'POST',
                data: {
                    type  : 'notaconsumidor',
                    method: 'consultar',
                    id    : idMovimento,
                    guid  : guidSefaz
                }
            });
        }

        let caixaImprimir = localStorage.getItem('letraCaixa') || await this.getLetraCaixa();        

        const resposta = querySefaz[0];

        if(resposta.data['protocolo'] && resposta.data['protocolo'] != '') {
            model.set('MOVIMENTOS_NFE', resposta.data['nfe']);
            model.set('MOVIMENTOS_PROTOCOLO', resposta.data['protocolo']);
            SamosUtils.Request.nodeApi({
                url: `/processos/movimentosredis`,
                method: 'POST',
                data: {
                    'MOVIMENTOSREDIS_ID'         : idMovimento,
                    'MOVIMENTOSREDIS_EMPRESA'    : idEmpresa,
                    'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS', 
                    'MOVIMENTOSREDIS_IMPRESSORA' : 'NOTACONSUMIDOR',
                    'MOVIMENTOSREDIS_LAYOUT'     : 'PosPrinter',
                    'MOVIMENTOSREDIS_CAIXA'      : caixaImprimir,
                    'MOVIMENTOSREDIS_PAGINAS'    : 1,
                    'MOVIMENTOSREDIS_PARAMETROS' : (statusMovimento == 'C' ? 'EMITIRCANCELADO' : 'EMITIR'),
                    'MOVIMENTOSREDIS_XML'        : resposta.data['retorno']                   
                }
            });
        } else {
            Ext.Msg.alert('Atenção', (resposta.data['retorno'] || resposta.data['status']));
        }

        console.time('Reload Nota Consumidor');
        const NFCCompleta = await NotaConsumidor.services.Model.get(idMovimento); 
        
        if((NFCCompleta || []).length > 0) {
            model.set(NFCCompleta[0].data);
        }

        this.getListView().getController().onBuscarClick();
        
        console.timeEnd('Reload Nota Consumidor');

        Ext.Note('success', 'Enviado para a impressora');
        
        view.stopGauge();
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

    onStatusClick: async function(btn, e){
        const view = this.getView(),
              vm   = this.getViewModel(),
              model = vm.get('model');

        const idMovimento = model.get('MOVIMENTOS_ID');                

        let guidSefaz = SamosUtils.String.gerarGuid();        

        let querySefaz = await SamosUtils.Request.nodeApi({
            url: `/processos/movimentos/enviosefaztxt`,
            method: 'POST',
            data: {
                type  : 'notaconsumidor',
                method: 'status',
                id    : idMovimento,
                guid  : guidSefaz
            }
        });

        const resposta = querySefaz[0];

        Ext.Msg.alert('Status', (resposta.data['status'] || resposta.data['retorno']));
        
        view.stopGauge();
    },

    onCancelamentoClick: async function(btn, e){
        const view = this.getView(),
              vm   = this.getViewModel(),
              model = vm.get('model');

        const idMovimento = model.get('MOVIMENTOS_ID');
        const idEmpresa   = model.get('MOVIMENTOS_ID_EMPRESAS');

        try {
            await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(3);
        } catch(error) {
            Ext.Note('warning', 'Não autorizado');            
            return;
        }    

        if( !await SamosUtils.Msg.confirm('Deseja realmente cancelar?') ){
            return;
        }

        let guidSefaz = SamosUtils.String.gerarGuid();

        let querySefaz = await SamosUtils.Request.nodeApi({
            url: `/processos/movimentos/enviosefaztxt`,
            method: 'POST',
            data: {
                type  : 'notaconsumidor',
                method: 'cancelar',
                id    : idMovimento,
                guid  : guidSefaz
            }
        });

        const resposta = querySefaz[0];     

        if(resposta.data['retorno'] && resposta.data['retorno'] != '') {
            SamosUtils.Request.nodeApi({
                url: `/processos/movimentosredis`,
                method: 'POST',
                data: {
                    'MOVIMENTOSREDIS_ID'         : idMovimento,
                    'MOVIMENTOSREDIS_EMPRESA'    : idEmpresa,
                    'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS', 
                    'MOVIMENTOSREDIS_IMPRESSORA' : 'NOTACONSUMIDOR',
                    'MOVIMENTOSREDIS_LAYOUT'     : 'PosPrinter',
                    'MOVIMENTOSREDIS_XML'        : resposta.data['retorno'],
                    'MOVIMENTOSREDIS_CAIXA'      : 1,
                    'MOVIMENTOSREDIS_PAGINAS'    : 1,
                    'MOVIMENTOSREDIS_PARAMETROS' : 'EMITIRCANCELADO'
                }
            });    

            console.time('Reload Nota Consumidor');
            const NFCCompleta = await NotaConsumidor.services.Model.get(idMovimento); 
            
            if((NFCCompleta || []).length > 0) {
                model.set(NFCCompleta[0].data);
            }
    
        }

        this.getListView().getController().onBuscarClick();

        Ext.Msg.alert('Cancelamento', (resposta.data['status'] || resposta.data['retorno']));

    },

    onEmailClick: async function(btn, e){
        const view = this.getView(),
              vm   = this.getViewModel(),
              model = vm.get('model');

        const idMovimento           = model.get('MOVIMENTOS_ID');
        const idEmpresa             = model.get('MOVIMENTOS_ID_EMPRESAS');
        const movimentosObservacoes = model.get('MOVIMENTOS_OBSERVACOES');

        /*
        Gera um QRCODE a partir de uma string, transforma em base64 e retorna
        */
        async function generateHiddenQrcodeBase64(data, width=128, height=128)
        {
            return new Promise( async(resolve)=>{

                const qrel = document.createElement('div');

                //Esconde o elemento do usuario antes de mostrar
                qrel.setAttribute('style', 'diplay:none;visibility:hidden;position:absolute;top:0px;left:0px;right:0px;bottom:0px;');
                
                Ext.defer( ()=>{
                    if( data == '' || data == null || data == undefined ){
                        console.warn('GERA QRCODE NOTACONSUMIDOR: Valor de "data" foi passado incorretamente', data);
                    }

                    document.body.prepend(qrel);
                    
                    const qrcode = new QRCode(qrel, {
                        text: data,
                        width: width,
                        height: height,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });

                    const img = qrel.querySelector('img');

                    img.onload = function(){
                        console.log( 'GERA QRCODE NOTACONSUMIDOR: carregou callback imagem', img, img.src );
                        const base64 = img.src;
                        qrel.remove();
                        resolve(base64);
                    }

                }, 100, this );

            } );
        }

        async function base64HttpEncode(s) {
            let result = btoa(s);
            result = result.replace(/\+/g, '-');
            result = result.replace(/\//g, '_');
            result = result.replace(/=+$/, '');

            return result;
        }
        
        //ENVIAR O EMAIL ANEXANDO O PDF
        try {
            const retiradosPipes = movimentosObservacoes.split('|');
            const base64qrcode = (await generateHiddenQrcodeBase64( retiradosPipes[ retiradosPipes.length-1 ] ));
            const base64Codificado = (await base64HttpEncode(base64qrcode));

            //Parametros adicionais passados pela view
            view.parametrosEnviarEmail = {
                cancelado     : vm.get('isCancelado'),
                base64qrcode  : base64Codificado,
                dataModel     : model.data,
                empresacnpj   : configs.getEmpresa().cnpj,
                empresanome   : configs.getEmpresa().nome  
            };

            await Movimento.services.Email.enviar(view);
            view.stopGauge();

        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao enviar email');
        }

        /*
        SamosUtils.Request.nodeApi({
            url: `/processos/movimentosredis`,
            method: 'POST',
            data: {
                'MOVIMENTOSREDIS_ID'         : idMovimento,
                'MOVIMENTOSREDIS_EMPRESA'    : idEmpresa,
                'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS', 
                'MOVIMENTOSREDIS_IMPRESSORA' : 'NOTACONSUMIDOR',
                'MOVIMENTOSREDIS_LAYOUT'     : 'PosPrinter',
                'MOVIMENTOSREDIS_PAGINAS'    : 1,
                'MOVIMENTOSREDIS_PARAMETROS' : 'EMAIL'
            }
        });*/
    },

    onCaixaClick: async function (btn, e) {
        const view = this.getView();
        const vm = this.getViewModel();
        let statusCaixa = '';

        try {
            const movimentoFaturado = vm.get('isFaturado');
        
            if(!movimentoFaturado) {
                if(configs.getEmpresa().regimeCaixa) {
                    view.initGauge('Verificando caixa diário...');
        
                    const data = this.getRecord().get('MOVIMENTOS_EMISSAO');
                    statusCaixa = await Caixa.services.Model.getStatus(data);
            
                    view.stopGauge(true);    
                } else {
                    statusCaixa = 'A';
                }
        
                if(statusCaixa == 'A') {
                    NotaConsumidor.services.Caixa.criarJanelaReceber();
                } else if(statusCaixa == 'F') {
                    throw 'O caixa diário está fechado!';
                } else if(!statusCaixa) {
                    throw 'O caixa diário não foi aberto!';
                }
            } else { 
                NotaConsumidor.services.Caixa.criarJanelaReceber();
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao abrir caixa');
        }

        view.stopGauge(true);
    },

    onImportarClick: Ext.emptyFn,
    onOpcoesClick: Ext.emptyFn,
    
    onDeOrcamentoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton'); 

        NotaConsumidor.services.ImportacaoExportacao.deOrcamento(btnImportar);
    },
    
    onDeRequisicaoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        NotaConsumidor.services.ImportacaoExportacao.deRequisicao(btnImportar);
    },
    
    onDePedidoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        NotaConsumidor.services.ImportacaoExportacao.dePedido(btnImportar);
    },

    checarValoresCabecalho: function(form) {
        const produtos = this.lookup('produtos').getStore().data.items || [];
        const desconto = cents(form.model.get('MOVIMENTOS_DESCONTOS'));
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
        form.model.set('MOVIMENTOS_TOTAL', (somaProdutosCents - desconto) / 100);
    },

    onPessoasEditClick: function(txt) {
        NotaConsumidor.services.Documento.iniciarVendaConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasCloseClick: function(txt) {
        NotaConsumidor.services.Documento.cancelarVendaConsumidor(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasChange: function(){
        NotaConsumidor.services.Documento.checkVendaConsumidor(this.getView());
    },

    updateLog: function(txt, record) {
        const time = momentServer().format('HH:mm:ss');
        const logon = record.get('USUARIOS_LOGIN');
        const result = logon + ' ' + time;
        
        if(!configs.getMovimentos().carregaVendedorPessoa) {
            this.getRecord().set('MOVIMENTOS_LOG', result);
        }
        
        if(!configs.getMovimentos().carregaVendedor){
            const gridItems = this.lookup('produtos');
            Ext.defer(gridItems.focarNovoItem, 200, gridItems);
        }
    },

    changeCpfCnpj: function(txt) {        

        const cpfCnpj = SamosUtils.String.onlyNumbers(txt.getValue());
        txt.setValue(cpfCnpj);        

    },

    validateCpf: async function (txt, event) {
        if (SamosUtils.Events.isTab(event) || SamosUtils.Events.isEnter(event)) {
            if(!txt.getValue()) {

            } else {
                if(!SamosUtils.String.isCpf(txt.getValue())) {
                    Ext.Note('warning', 'CPF Inválido');
                    Ext.defer(txt.focus, 250, txt, [true]);
                    return;
                }    
            }
        }
    },

    validateEmail: async function (txt, event) {
        if (SamosUtils.Events.isTab(event) || SamosUtils.Events.isEnter(event)) {
            if(!txt.getValue()) {

            } else {
                if(!SamosUtils.String.isEmail(txt.getValue())) {
                    Ext.Note('warning', 'E-mail Inválido');
                    Ext.defer(txt.focus, 250, txt, [true]);
                    return;
                }    
            }
        }
    },

    aposBuscarPessoa: async function(txt, record) {
        this.lookup('celular').focus(true);
//        this.lookup('produto0').focus(true);
    },
    
    onGravacaoSucesso: async function(movimentoNovo) {
        const model = this.getRecord();
        const thisController = this;
        const vm = this.getViewModel()

        let movimentoOriginal = vm.get('movimentosOriginais');
        let movimentosOriginais = [];
        
        if(cents(movimentoNovo.get('MOVIMENTOS_NUMEROORIGEM') > 0)) {
            movimentosOriginais.push(movimentoOriginal);
        }

        if(movimentosOriginais && movimentoNovo.isNew() && movimentoNovo.get('MOVIMENTOS_NUMEROORIGEM')) {
            Movimento.services.ImportacaoExportacao.atualizarOriginais(movimentoNovo, movimentosOriginais, this);
        } else {
            this.callParent(arguments);
        }

        NotaConsumidor.services.Recuperacao.apagar(movimentoNovo, Ext.NAVEGADOR_TAB_ID);
        NotaConsumidor.services.Model.updateUltimoDoctoNFC();
        
        this.finalizarEdicao();
        Ext.defer(this.getViewModel().set, 600, this.getViewModel(), ['forceChangeId', Math.random()]);

        this.getViewModel().set('initialValues', Object.assign({}, movimentoNovo.data));
        movimentoNovo.store = true;//para mostrar que ja esta gravado
        
        setTimeout(() => {
            this.setReadOnly(true);
            Ext.asap(() => this.getListView().getController().onBuscarClick());
        }, 100);

        this.getView().stopGauge();

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
                            log: `Preço a menor nota consumidor|MOVIMENTOSITENS|${empresa}|${idItem}|${serie}`
                        }
                    });
                });

                thisController.atualizarLog( model );

                if(cents(movimentoNovo.get('MOVIMENTOS_NUMEROORIGEM')) == 0){
                    Ext.Note('success', 'Gravado com sucesso!');
                }

                //Se tiver o callback depoisQueGravou, ele roda
                if( thisController.getView().depoisQueGravou ){
                    thisController.getView().depoisQueGravou.bind(thisController)( thisController.getView(), model );
                }
                
        }, 1000);
    },

    onGravacaoFalha: function (error) {
        console.error(error);
        Ext.Note('error', 'Erro no servidor');
        try {
            SamosUtils.Events.disableWarnReload();
            this.getView().stopGauge();
        } catch(e) {}
    },

    aposGravar: Ext.emptyFn,

    validarQtdeMaxima: function(txt, event) {
        if(txt.readOnly) { return; }

        const produto = txt.up('form').getForm().getValues();
        const id      = produto['MOVIMENTOSITENS_ID_PRODUTOS'];
        const qtde    = grams(produto['MOVIMENTOSITENS_QUANTIDADE']);

        if(configs.getMovimentos().avisarSaldoInsuficiente) { 
            const saldoLocal = grams(produto['SALDOS_DISPONIVEL']);
    
            if(qtde > saldoLocal) {
                Ext.Note('warning', `Produto: ${id} - Saldo Insuficiente (Local: ${parseInt(saldoLocal / 1000)})`, 4000);
            }
        }
    },

    onWhatsAppClick: async function(btn, e) {

        const movimento = this.getRecord();
        
        const caixa = movimento.get('MOVIMENTOS_CAIXA')[0] || [];

        const linkUrl = caixa['MOVIMENTOSCAIXA_QRCODE'] || '';

        if(linkUrl) {
            await SamosUtils.Msg.alert('Copiar link para área de transferência?', linkUrl);
            await navigator.clipboard.writeText(linkUrl);
            Ext.Note('success', 'Copiado para área de transferência');    
        } else {
            Ext.Note('warning', 'Link para WhatsApp não encontrado');
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

    obterNumeroComanda: function() {
        return new Promise(resolve => {
            const win = Ext.create({
                xtype: 'window',
                title: 'Informe a Comanda',
                autoShow: true,
                closable: false,
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
