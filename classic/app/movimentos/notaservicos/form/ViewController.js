Ext.define('SamosAdmin.movimentos.notaservicos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formnotaservicos',

    mixins: {
        cartoes:  'SamosAdmin.movimentos.notaservicos.form.caixa.cartoes.Mixin',
        servicos: 'SamosAdmin.movimentos.notaservicos.form.mixins.Servicos',
        status:   'SamosAdmin.movimentos.notaservicos.form.mixins.Status'
    },

    onAfterConstructor: async function(){
        
    },

    fazerSomasERateios: function(txt) {
        const notaservicos = this.getRecord();
        const vm = this.getViewModel();
        const servicos = vm.getStore('servicos').data.items;

        this.iniciarEdicao();

        const somaTotalBrutoServicos = servicos.reduce((total, servico) => {
            console.log('getting: ', servico.get('ORDENSSERVICOS_TOTAL'))
            return total + cents(servico.get('ORDENSSERVICOS_TOTAL'));
        }, 0);

        console.log('FazerSomas e Rateios: somaServicos: ', somaTotalBrutoServicos);

        const totalDescontos = cents(notaservicos.get('ORDENS_DESCONTOS'));
        const totalISS       = cents(notaservicos.get('ORDENS_VALORISS'));
        const totalINSS      = cents(notaservicos.get('ORDENS_VALORINSS'));
        const totalRetencoes = cents(notaservicos.get('ORDENS_VALORRETENCOES'));

        if(notaservicos.get('ORDENS_ISSRETIDO') == 'R') {
            notaservicos.set({
                'ORDENS_SERVICOS'        : somaTotalBrutoServicos / 100,           
                'ORDENS_TOTAL'           : ((somaTotalBrutoServicos - totalDescontos - 
                                            totalISS - totalINSS - totalRetencoes) / 100),
                'CONTAGEM_ITENSSERVICOS' : this.lookup('servicos').getStore().data.items.length
            });    
        } else {
            notaservicos.set({
                'ORDENS_SERVICOS'        : somaTotalBrutoServicos / 100,           
                'ORDENS_TOTAL'           : ((somaTotalBrutoServicos - totalDescontos - 
                                            totalINSS - totalRetencoes) / 100),
                'CONTAGEM_ITENSSERVICOS' : this.lookup('servicos').getStore().data.items.length
            });    
        }
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

    onImprimirClick: async function() {
        const view  = this.getView();
        const model = this.getRecord();
        
        try {
            
            view.initGauge('Gerando impressão...');

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/docsfiscais/${configs.getClientName()}/danfs/${model.get('ORDENS_ID')}`,
                method: 'GET',
                data: {
                    tabelaservicos: configs.getMovimentos().tabelaServicos || []                    
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0]['name'], 
                serverType: 'nodejs'
            });
            
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    atualizarCalculos: async function(txt, event) {

        return true;

        try {
            this.iniciarEdicao();

            //verifica se a alteração foi disparada no cabecalho ou na grid de itens
            const alteracaoCabecalho = !txt.fromGridItems;

            //caso a alteracao tenha sido feita em um item
            //pega os valores dos campos da linha alterada e coloca na variavel "servico"
            const formServico = alteracaoCabecalho ? null : txt.up('form').getForm();

            //pega o nome do campo alterado (se for do cabecalho pega do bind)
            const fieldName = alteracaoCabecalho ? txt.bind.value.stub.name : txt.name

            //pega o movimento e os serviços
            //que são as referencias confiáveis usadas nos calculos
            const notaservicos = this.getRecord();

            const result = NotaServicos.calculos.RecalculoSync.calcular({
                servico      : formServico ? formServico.getValues() : null,
                notaservicos : Object.assign({}, notaservicos.data),//não envia o model apenas os valores
                event        : event ? event.type : null,
                fieldName    : fieldName
            });

            this.efetivarCalculos(result, formServico, alteracaoCabecalho);

            if(result.mensagem) {
                Ext.Note('warning', result.mensagem);
                txt.focus(true);
            }

            if(result.senhaNivel  && !configs.getMovimentos().desativaSenha) {
                const options = {
                    servico      : formServico ? formServico.getValues() : null,
                    notaservicos : Object.assign({}, notaservicos.data),
                    event        : null,
                    fieldName    : fieldName
                };

                try {
                    await Ext.create({ xtype: 'samoswidgets-senhanivel' }).iniciar(result.senhaNivel.nivel);
                    result.senhaNivel.autorizar(options);
                } catch(error) {
                    result.senhaNivel.rejeitar(options);
                }

                const resultAtualizado = NotaServicos.calculos.RecalculoSync.calcular(options);

                this.efetivarCalculos(resultAtualizado, formServico, alteracaoCabecalho);
            }

        } catch(error) {
            console.error(`[atualizarCalculos] Erro`)
            console.error(error);
        }
    },

    efetivarCalculos: function(result, formServico, alteracaoCabecalho) {
        const notaservicos = this.getRecord();

        //atualiza o model, que é sempre a referencia mais confiável
        notaservicos.set(result.notaservico);

        //se a alteração foi feita em um campo do cabecalho
        if(alteracaoCabecalho) {
            //aguarda o usuário ficar mais de 2s sem digitar (para evitar delays durante a digitação)
            clearTimeout(this.loadItemsTimeout || 0);
            this.loadItemsTimeout = setTimeout(() => {
                this.loadItemsTimeout = 0;
                //atualiza toda a grid de itens com os novos valores calculados
                this.lookup('servicos').carregar(result.notaservico['ORDENS_SERVICOS']);
            }, 2000);

        //se um serviço foi apagado
        } else if(result.servico && result.servico['ORDENSSERVICOS_ID_SERVICOS'] == '') {
            //atualiza toda a grid de itens com os novos valores calculados
            this.lookup('servicos').carregar(result.notaservicos['ORDENS_SERVICOS']);
        } else {
            //se a alteração foi feita diretamente no item
            //atualiza os campos apenas para visualizacao
            if(result.servico && result.servico['ORDENSSERVICOS_ID_SERVICOS'] != '') {
                formServico.setValues(result.servico);
            } else {
                formServico.reset();
            }
        }
    },

    onNovoClick: async function () {
        const view = this.getView();

        try {
            const nomeDocumento = 'Nota Serviço';
            const form = await this.callParent(arguments);
            await NotaServicos.services.Model.definirValoresPadrao(form, nomeDocumento);

            view.initGauge(); 
/*
            const nsPendentes = await NotaServicos.services.Documento.verificarNSPendentes({ 
                meses     : 1,
                incluiHoje: 'F'
            });

            if(nsPendentes) {
                view.stopGauge();
                SamosUtils.Msg.alert('Lembrete', `Há notas de serviço a serem enviadas!<br><h5>${nsPendentes}<h5>`, 4000);
            }*/

            let nsForaSequencia = '';

            nsForaSequencia = await NotaServicos.services.Documento.verificarSequenciaNS();
                
            if(nsForaSequencia) {
                view.stopGauge();
                SamosUtils.Msg.alert('Atenção', `Há notas fora da sequência!<br><h5>${nfForaSequencia}</h5>`, 4000);
                return; 
            }

            proximaNfs = await NotaServicos.services.Documento.getProximaNFse();

            if(proximaNfs != this.getViewModel().get('modelNumero') &&
                proximaNfs > 0) {  // Atualiza numero da nota de serviço
                this.getViewModel().set({
                    'modelNumero' : (proximaNfs + 1)
                });    
            }        
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível incluir uma nova nota de serviços');
        }

        view.stopGauge();
        this.lookup('pessoa').focus(true);        

        return view;
    },

    onExportarClick: Ext.emptyFn,

    onParaNotaEletronicaClick: function(itemMenu, e) {
        const model = this.getRecord();
        const form = this.getView();
        const list = this.getListView();

        //Passa o nfc para dentro do propio form, pra poder enviar como parametro na hora de exportar
        form.nfcNota = model.get('ORDENS_NFE');

        NotaServicos.services.ImportacaoExportacao.paraNotaEletronica(form, list);
    },

    /**Função para atualizar o campo LOG apos gravar */
    atualizarLog: async function( modelParam ){
        const view  = this.getView(),
              vm    = this.getViewModel();

        Ext.defer( async()=>{
            view.lookupReference('log').setValue( modelParam.get('ORDENS_LOG') );

        }, 200, this );
    },

    onAlterarClick: function (btn, event) {
        const form = this.getView();
        const model = this.getRecord();
        const thisController = this;

        if(
            !this.permiteAlteracao && 
            !configs.getMovimentos().desativaSenha &&
            !configs.getUsuario().privilegiado
        ){
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
            const id      = model.get('ORDENS_ID');
            const numero  = model.get('ORDENS_NUMERO');
            const serie   = model.get('ORDENS_SERIE');
            const empresa = model.get('ORDENS_ID_EMPRESAS');

            model.getProxy().setExtraParam('log', `PUT /notaservicos/${id} (${numero}|${serie}|${empresa})`);
            NotaServicos.services.Model.bloquearParaEdicao(model, form);

            //ajusta para pegar padrão como digitado em dinheiro
            const tipoDesconto = model.get('DOCUMENTOS_DESCONTOITEM');
            const digitouDescontoCabecalho = tipoDesconto == 'F' || tipoDesconto == 'A';

            form.getViewModel().set({
                digitouDescontoCabecalho:             digitouDescontoCabecalho,
                digitouDescontoCabecalhoEmDinheiro:   digitouDescontoCabecalho,
                digitouDescontoCabecalhoEmPercentual: false,
                digitouDescontoItem:                  tipoDesconto == 'T'
            });

            this.callParent(arguments);
            delete this.permiteAlteracao;
        }
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
                NotaServicos.services.Model.liberarParaEdicao(model, view);

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

        const id      = model.get('ORDENS_ID');
        const numero  = model.get('ORDENS_NUMERO');
        const serie   = model.get('ORDENS_SERIE');
        const empresa = model.get('ORDENS_ID_EMPRESAS');

        Ext.Msg.confirmDelete(btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Excluindo...');
                this.colocarFilhosNoModel(model);

                model.getProxy().setExtraParam('log', `DELETE /notaservicos/${id} (${numero}|${serie}|${empresa})`);

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
    },

    onFecharClick: async function(btn, e) {
        const view = this.getView();
        const vm = this.getViewModel();

        view.initGauge('Fechando...');

        if((vm.get('model.PESSOAS_OBSERVACOES') || '').slice(0, 16) == 'PEDIDO DE COMPRA' &&
           !vm.get('model.ORDENS_OBSERVACOES').toUpperCase().match(/COMPRA/g)) {
            if( !await SamosUtils.Msg.confirm('Pedido de compra não informado - continua?') ) {
                view.stopGauge();                
                return
            }
        }

        await SamosUtils.Utils.sleep(100);
        view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        try {
            await this.validarCabecalho();
            const valido = true;

            if(valido){
                await NotaServicos.services.Impostos.calcular(view);
                this.checarValoresCabecalho(view);
                this.finalizarEdicao();
                view.stopGauge();                
            } else {
                return
            }

        } catch(error) {
            console.error(error)
            SamosUtils.Msg.error(error, 'Falha ao fechar');
            view.stopGauge();
            throw error;
        }

        SamosUtils.Events.disableWarnReload();
    },

    onGravarClick: async function (btn, event) {
        const view = this.getView();
        const vm = this.getViewModel();

        view.initGauge('Gravando...');

        await SamosUtils.Utils.sleep(100);
        view.query('samoswidgets-griditems').forEach(grid => grid.finalizarEdicao());

        try {
            await this.validarCabecalho();
            const valido = true;//NotaServicos.services.Caixa.validarReceber();

            if(valido){
                await NotaServicos.services.Impostos.calcular(view);
                this.checarValoresCabecalho(view);
                this.finalizarEdicao();
            } else {
                return
            }

            const notaservicos = this.getRecord();

            let status = notaservicos.get('ORDENS_STATUS');

            if(status == 'B'){//cancelado em uso
                status = 'C';
            } else if(status == 'M'){//nao faturado em uso
                status = 'N';
            } else if(status == 'E'){//faturado em uso
                status = 'F';
            }

            notaservicos.set('ORDENS_STATUS', status);

            this.colocarFilhosNoModel(notaservicos);

            notaservicos.set('USUARIOS_LOGIN', configs.getUsuario().login);

            const notaservicosSalva = await notaservicos.save();
            
            this.onGravacaoSucesso(notaservicosSalva);

        } catch(error) {
            console.error(error)
            if(error && error.error == 'Divergência'){
                this.iniciarEdicao();
                error = 'Há divergência entre os valores da nota de serviços. Tente novamente.';
            }

            SamosUtils.Msg.error(error, 'Falha ao gravar');
            view.stopGauge();
            throw error;
        }

        SamosUtils.Events.disableWarnReload();
    },

    onSefazClick: function (btn, e) {
        Movimento.services.Sefaz.criarJanela('notaservicos', 'ORDENS');  // form, tabela
    },

    onEmailClick: async function(btn, e){
        const view = this.getView(),
              vm   = this.getViewModel(),
              model = vm.get('model');

        const idMovimento           = model.get('ORDENS_ID');
        const idEmpresa             = model.get('ORDENS_ID_EMPRESAS');
        const movimentosObservacoes = model.get('ORDENS_OBSERVACOES');

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
                        console.warn('GERA QRCODE NOTASERVICOS: Valor de "data" foi passado incorretamente', data);
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
                        console.log( 'GERA QRCODE NOTASERVICOS: carregou callback imagem', img, img.src );
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
        
                    const data = this.getRecord().get('ORDENS_EMISSAO');
                    statusCaixa = await Caixa.services.Model.getStatus(data);
            
                    view.stopGauge(true);    
                } else {
                    statusCaixa = 'A';
                }
        
                if(statusCaixa == 'A') {
                    NotaServicos.services.Caixa.criarJanelaReceber();
                } else if(statusCaixa == 'F') {
                    throw 'O caixa diário está fechado!';
                } else if(!statusCaixa) {
                    throw 'O caixa diário não foi aberto!';
                }
            } else { 
                NotaServicos.services.Caixa.criarJanelaReceber();
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao abrir caixa');
        }

        view.stopGauge(true);
    },

    onImportarClick: Ext.emptyFn,
    onOpcoesClick: Ext.emptyFn,

    onDeOrdemServicoClick: function(itemMenu, e) {
        const btnImportar = itemMenu.up('samoswidgets-dinamicbutton');     
        
        NotaServicos.services.ImportacaoExportacao.deOrdemServico(btnImportar);
    }, 
    
    checarValoresCabecalho: function(form) {        
        const servicos = this.lookup('servicos').getStore().data.items || [];
        const isRetido = form.model.get('ORDENS_ISSRETIDO') == 'R';
        const desconto  = cents(form.model.get('ORDENS_DESCONTOS'));
        const valorISS  = cents(form.model.get('ORDENS_VALORISS'));
        const valorINSS = cents(form.model.get('ORDENS_VALORINSS'));
        const valorRetencoes = cents(form.model.get('ORDENS_VALORRETENCOES'));

        const casasDecimaisPreco = configs.getMovimentos().casasDecimaisPreco || 2;

        const somaServicos = servicos.reduce((total, servico) => {
            //converte o preco para inteiro, ex: R$ 1,234567 fica 1234567 (para bater os calculos no javascript)
            const precoInt = toPrecision(servico.get('ORDENSSERVICOS_PRECO'), casasDecimaisPreco);
            const qtde     = grams(servico.get('ORDENSSERVICOS_QUANTIDADE')) || 0;
            
            return total + Math.round((precoInt * qtde) / 1000);
        }, 0);

        //após calcular divide pelas casas decimais novamente e arredonda para centavos para calcular os outros campos
        const somaServicosCents = Math.round(somaServicos / Math.pow(10, (casasDecimaisPreco - 2)));

        form.model.set('ORDENS_SERVICOS', somaServicosCents / 100);

        if(isRetido) { // Se tem retenção de ISS
            form.model.set('ORDENS_TOTAL', (somaServicosCents - desconto - valorISS - valorINSS - valorRetencoes) / 100);
        } else {
            form.model.set('ORDENS_TOTAL', (somaServicosCents - desconto - valorINSS - valorRetencoes) / 100);
        }

    },

    onPessoasEditClick: function(txt) {
        NotaServicos.services.Documento.iniciarVendaServicos(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onPessoasCloseClick: function(txt) {
        NotaServicos.services.Documento.cancelarVendaServicos(this.getView());
        Ext.defer(txt.focus, 100, txt, [true]);
    },

    onAtividadeMunicipalChange: function (combo, nv, ov) {

        const model = this.getRecord();
        const vm = this.getViewModel();
        const cdmEmp = model.get('EMPRESAS_ID_CIDADES');
        const munEmp = model.get('CIDADES_NOMEEMPRESA');
        const ufEmp = model.get('CIDADES_ESTADOEMPRESA');
        const cdmPre = model.get('ORDENS_ID_CIDADES');
        const munPre = model.get('CIDADES_NOMEPRESTACAO');
        const ufPre = model.get('CIDADES_ESTADOPRESTACAO');

        let aliqISS = 0;
        let codAtiv = '';
        let listaAtividades = configs.getMovimentos().tabelaServicos;

        for(let l in listaAtividades) {
            if(listaAtividades[l][0] == nv) {
                codAtiv = listaAtividades[l][0];
                aliqISS = listaAtividades[l][2];
            }
        }

        if(codAtiv == '14.14') { // Intra-municipal
            model.set({
                'ORDENS_IDSKY': cdmEmp, 
                'CIDADES_NOMEINCIDENCIA': munEmp,
                'CIDADES_ESTADOINCIDENCIA': ufEmp
            });
        } else {
            model.set({
                'ORDENS_IDSKY': cdmPre, 
                'CIDADES_NOMEINCIDENCIA': munPre,
                'CIDADES_ESTADOINCIDENCIA': ufPre
            });
        }

        model.set('ORDENS_ALIQUOTAISS', aliqISS);

        vm.set('editionClosed', false);
    },

    forcarRecalculo: function (combo, nv, ov) {

        const vm = this.getViewModel();

        vm.set('editionClosed', false);
    },

    updateLog: function(txt, record) {
        const time = momentServer().format('HH:mm:ss');
        const logon = record.get('USUARIOS_LOGIN');
        const result = logon + ' ' + time;
        
        if(!configs.getMovimentos().carregaVendedorPessoa) {
            this.getRecord().set('ORDENS_LOG', result);
        }
        
        if(!configs.getMovimentos().carregaVendedor){
            const gridItems = this.lookup('servicos');
            Ext.defer(gridItems.focarNovoItem, 200, gridItems);
        }
    },

    changeCpfCnpj: function(txt) {
        const vm = this.getViewModel();
        const cpfCnpj = SamosUtils.String.onlyNumbers(txt.getValue());

        if(vm.get('readOnly') || !vm.get('isVendaServicos')) { 
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
        this.lookup('servico0').focus(true);
    },
    
    onGravacaoSucesso: async function(notaservicosNova) {

        const vm = this.getViewModel();
        const ordensOriginais = vm.get('ordensOriginais');

        const model = this.getRecord();
        const thisController = this;

        NotaServicos.services.Recuperacao.apagar(notaservicosNova, Ext.NAVEGADOR_TAB_ID);
        NotaServicos.services.Model.updateUltimoDoctoNFS();

        if(ordensOriginais && notaservicosNova.isNew() && notaservicosNova.get('ORDENS_NUMEROORIGEM')) {
            if((ordensOriginais[0].get('ORDENS_ID_DOCUMENTOS').toString() || '').slice(-4) == '0007') {
                NotaServicos.services.ImportacaoExportacao.atualizarOriginais(notaservicosNova, ordensOriginais, this);
            }
        } else {
            this.callParent(arguments);
        }

        this.finalizarEdicao();
        Ext.defer(this.getViewModel().set, 600, this.getViewModel(), ['forceChangeId', Math.random()]);

        this.getViewModel().set('initialValues', Object.assign({}, notaservicosNova.data));
        notaservicosNova.store = true;
        
        setTimeout(() => {
            this.setReadOnly(true);
            Ext.asap(() => this.getListView().getController().onBuscarClick());
        }, 100);

        const consultaValorRestante = await SamosUtils.Request.nodeApi({
            url: `/processos/executasql`,
            method: 'GET',
            query: {
                nomeSql: 'verifica_valorrestante_ordem',
                parametroSql: notaservicosNova.get('ORDENS_ID')
            }
        }); 

        let valorRestanteSQL = 0;

        if(consultaValorRestante.results.length > 0) {
            valorRestanteSQL = cents(consultaValorRestante.results[0].VALORRESTANTE);
        }

        const valorMovimento   = cents(notaservicosNova.get('ORDENS_TOTAL'));

        const geraNovoCaixa = notaservicosNova.get('OPERACOES_FINANCEIRO') != 'N' && valorRestanteSQL != valorMovimento;

        if(geraNovoCaixa && !configs.getEmpresa().regimeCaixa ){
            notaservicosNova.set({'ORDENS_STATUS': 'N'});
            const thisController = this;
            thisController.getView().initGauge('Solicitando pagamento ...');

            Ext.defer( ()=>{
                if( Ext.$('formnotaservicoscaixa').length == 0 ){
                    Ext.$('formnotaservicos')[0].down('button[text="Pagamento"]').el.dom.click();
                }

                thisController.getView().stopGauge();
            }, 1000, this );
        }

        this.getView().stopGauge();

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

                if(momentTz(novaEmissao).isBefore(momentServer().startOf('month').format('YYYY-MM-DD'))) {
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
                    url: `/processos/movimentos/alteraremissao/${movimento.get('ORDENS_ID')}`,
                    method: 'PUT',
                    data: {
                        'ORDENS_EMISSAO': novaEmissao
                    },
                    query: {
                        senhaNivel: true
                    }
                });

                Ext.Note('success', 'Emissão alterada com sucesso');

                movimento.set('ORDENS_EMISSAO', novaEmissao);

                win.destroy();
            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao alterar data da emissão');
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
                        url: `/processos/movimentos/alterarvendedor/${movimento.get('ORDENS_ID')}`,
                        method: 'PUT',
                        data: {
                            'ORDENS_ID_USUARIOS': novoVendedor
                        }
                    });
    
                    Ext.Note('success', 'Vendedor alterado com sucesso');
    
                    const nomeVendedor = searchVendedor.results[0]['USUARIOS_NOME'] || '';

                    movimento.set('ORDENS_ID_USUARIOS', novoVendedor);    
                    movimento.set('USUARIOS_NOME', nomeVendedor);    
                    
                    win.destroy();

                }

            } catch(error) {
                win.stopGauge(true);
                SamosUtils.Msg.error(error, 'Falha ao alterar Vendedor');
            }
        }
    },

    onDeXMLClick: function(itemMenu, e) {
        const fileField = this.lookup('carregarxml').getEl().query('input[type="file"]')[0];
        fileField.value = '';
        fileField.click();    
    },

    onCarregarXMLChange: async function(filefield) {
        await NotaServicos.services.ImportacaoExportacao.deXML(filefield);
//        this.fazerSomasERateios();
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
