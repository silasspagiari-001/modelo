Ext.define('SamosAdmin.movimentos.movimento.form.transporte.ViewController', {
    extend: 'SamosAdmin.movimentos.movimento.form.ViewController',
    alias: 'controller.formmovimentostransporte',

    moduleName: 'MOVIMENTOSENVIO',

    initViewModel: async function(vm) {
        this.callParent(arguments);

        await SamosUtils.Utils.sleep(500);

        const txtCep = this.lookup('cep');
        const cep = SamosUtils.String.onlyNumbers(vm.get('model.MOVIMENTOSENVIO_CEP'));
        txtCep.setSearchedId(cep);
    },

    onImprimirClick: async function(impressora, layout) {

        if(impressora != 'ViPP') {
            if(impressora == 'Visualizar' || !configs.getRedis()) {
                this.onVisualizarClick(impressora, layout); 
                return;           
            }    
        }

        const view = this.getView();
        
        if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')) {
            try {
                view.initGauge('Imprimindo...');

                const movimento   = view.up('formmovimentos').getViewModel().get('model');
                const idMovimento = movimento.get('MOVIMENTOS_ID');
                const record      = this.getRecord();

                if(impressora == 'ViPP') {//hospitalar
                    const queryPDF = await SamosUtils.Request.nodeApi({
                        url: `/processos/vtex/etiquetavipp`,
                        method: 'GET',
                        query: {
                            'MOVIMENTOS_NUMERO': movimento.get('MOVIMENTOS_NUMERO')
                        }
                    });

                    await SamosUtils.Utils.sleep(1000);

                    SamosUtils.Pdf.exibir({
                        local: 'tab',
                        caminho: queryPDF.results[0]['name'], 
                        serverType: 'nodejs'
                    });

                } else {

                    const qtdePaginas = cents(record.get('MOVIMENTOSENVIO_VOLUMES') / 100) || 1;

                    SamosUtils.Request.nodeApi({
                        url: `/processos/movimentosredis`,
                        method: 'POST',
                        data: {
                            'MOVIMENTOSREDIS_ID'         : idMovimento,
                            'MOVIMENTOSREDIS_TABELA'     : 'MOVIMENTOS', 
                            'MOVIMENTOSREDIS_IMPRESSORA' : impressora,
                            'MOVIMENTOSREDIS_LAYOUT'     : layout,
                            'MOVIMENTOSREDIS_PAGINAS'    : qtdePaginas,
                            'MOVIMENTOSREDIS_PARAMETROS' : 'DESPACHO'
                        }
                    });
        
                    Ext.Note('success', 'Enviado para impressora');
    
                }

            } catch(error) {
                Ext.defer(() => SamosUtils.Msg.error(error, 'Falha ao imprimir'), 100);
            }

            view.stopGauge(false);
        }
    },

    onVisualizarClick: async function(impressora, layout) {
        const view = this.getView();

        try {
            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const impressao = configs.getClientName() == 'hospitalar' ? impressora : '';

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/etiquetadespacho${impressao}`,
                    method: 'GET',
                    query: {
                        empresa: configs.getEmpresa().id,
                        empresacnpj : configs.getEmpresa().cnpj,                        
                        id     : this.getRecord().get('MOVIMENTOSENVIO_ID_MOVIMENTOS'),
                        start  : 0,
                        limit  : 1
                    }
                });

                await SamosUtils.Utils.sleep(500);

                SamosUtils.Pdf.exibir({
                    local: 'tab',
                    caminho: queryPDF.results[0]['name'], 
                    serverType: 'nodejs'
                });
            }

        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao imprimir');
        }

        view.stopGauge();
    },

    onConfirmarClick: async function (btn, e) {
        const callback = typeof e == 'function' ? e : undefined;
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();

        if(Movimento.services.Transporte.validar()) {

            await this.validarPesosNfe();

            if(btn.getText() == 'Gravar') {
                callback();
            } else {
                Ext.defer(this.onSairClick, 400, this);
                Ext.defer(ctrlMovimento.onFecharClick, 1000, ctrlMovimento);
            }
        }
    },

    onGravarClick: function(btn, e) {
        const formMovimento = this.getView().up('formmovimentos');
        const ctrlMovimento = formMovimento.getController();
        const movimento = ctrlMovimento.getRecord();
            
        this.onConfirmarClick(btn, async () => {
            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                try {
                    this.getView().initGauge('Gravando...');
                    ctrlMovimento.colocarFilhosNoModel.call(ctrlMovimento, movimento);
                    const movimentoSalvo = await movimento.save();
                    ctrlMovimento.onGravacaoSucesso.call(ctrlMovimento, movimentoSalvo);
                } catch(error) {
                    ctrlMovimento.onGravacaoFalha.call(ctrlMovimento, error);
                }

                ctrlMovimento.aposGravar.call(ctrlMovimento);
                ctrlMovimento.setReadOnly.call(this, true);
                this.getView().stopGauge();
            }
        });
    },

    onCancelarClick: function() {
        this.getViewModel().set('model', undefined);
        this.callParent(arguments);        
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
    },

    setCepSearchedId: function (txt, record) {
        this.lookup('cep').setSearchedId(record.get('TRANSPORTES_CEP'));
    },
    
    checkTransporteLivre: function(txt, newValue, oldValue){
        const model = this.getRecord();

        if(this.getViewModel().get('updating')) { 
/*            if(newValue == 1){
               Ext.defer(txt.un, 600, txt, ['keydown', txt.onTextSearch]);
                txt.setSearchedId(1);
                const formMovimento = this.getView().up('formmovimentos');
                const ctrlMovimento = formMovimento.getController();
                const movimento = ctrlMovimento.getRecord();
                
                const nomePessoa = movimento.get('MOVIMENTOS_NOME');
                const endPessoa = movimento.get('PESSOAS_ENDERECO');
                const cpfPessoa = movimento.get('PESSOAS_CPFCNPJ');
                const insPessoa = movimento.get('PESSOAS_INSCRICAO');
                const cepPessoa = movimento.get('PESSOAS_CEP');
                const baiPessoa = movimento.get('PESSOAS_BAIRRO');
                const numPessoa = movimento.get('PESSOAS_NUMERO');
                const cciPessoa = movimento.get('PESSOAS_ID_CIDADES');
                const cidPessoa = movimento.get('CIDADES_NOME');
                const ufPessoa  = movimento.get('CIDADES_ESTADO');
                const ibgPessoa = movimento.get('CIDADES_IBGE');
        
                model.set('MOVIMENTOSENVIO_MODO', 'F');
                model.set('MOVIMENTOSENVIO_NOME', nomePessoa);
                model.set('MOVIMENTOSENVIO_ENDERECO', endPessoa);
                model.set('MOVIMENTOSENVIO_CPFCNPJ', cpfPessoa);
                model.set('MOVIMENTOSENVIO_INSCRICAO', insPessoa);
                model.set('MOVIMENTOSENVIO_CEP', cepPessoa);
                model.set('MOVIMENTOSENVIO_BAIRRO', baiPessoa);
                model.set('MOVIMENTOSENVIO_NUMERO', numPessoa);
                model.set('MOVIMENTOSENVIO_ID_CIDADES', cciPessoa);
                model.set('CIDADES_NOME', cidPessoa);
                model.set('CIDADES_ESTADO', ufPessoa);
                model.set('CIDADES_IBGE', ibgPessoa);

                txt.proximoFoco = 'nometransporte';
    
            } else {*/
                txt.on('keydown', txt.onTextSearch);
                txt.proximoFoco = 'referente';
//            }
            
            if(oldValue && newValue != 1) {
                model.set({
                    'MOVIMENTOSENVIO_MODO': '',
                    'MOVIMENTOSENVIO_CPFCNPJ': '',
                    'MOVIMENTOSENVIO_NOME': '',
                    'MOVIMENTOSENVIO_INSCRICAO': '',
                    'MOVIMENTOSENVIO_CEP': '',
                    'TRANSPORTES_EMAIL': '',
                    'CIDADES_NOME': '',
                    'CIDADES_ESTADO': '',
                    'CIDADES_IBGE': '',
                    'MOVIMENTOSENVIO_ENDERECO': '',
                    'MOVIMENTOSENVIO_NUMERO': '',
                    'MOVIMENTOSENVIO_BAIRRO': '',
                    'MOVIMENTOSENVIO_ID_CIDADES': configs.getPermissao()['EMPRESAS_ID_CIDADES']
                });
            }
        }
    },

    validarPesosNfe: async function() {

        if(!configs.getMovimentos().calculaPesoNfe) {
            return true;
        }

        const formMovimento = this.getView().up('formmovimentos');
        const movimento     = formMovimento.getViewModel().get('model');
        const ctrlMovimento = formMovimento.getController();

        /*
        * Sem coleta de transporte:
        * o peso será sempre calculado automaticamente na gravação.
        * Não pergunta ao usuário.
        */
        if(movimento.get('DOCUMENTOS_COLETATRANSPORTE') == 'F') {
            return true;
        }        

        const pesos = ctrlMovimento.calcularPesoNfe();

         // Se não foi possível calcular peso pelos produtos,
        // mantém o peso informado pelo usuário sem perguntar.
        if(
            Number(pesos.pesoBruto || 0) === 0 &&
            Number(pesos.pesoLiquido || 0) === 0
        ) {
            return true;
        }

        const model = this.getViewModel().get('model');

        const pesoBrutoInformado =
            Number(model.get('MOVIMENTOSENVIO_PESOBRUTO') || 0);

        const pesoLiquidoInformado =
            Number(model.get('MOVIMENTOSENVIO_PESOLIQUIDO') || 0);

        const divergente =
            Math.abs(pesoBrutoInformado - pesos.pesoBruto) > 0.001 ||
            Math.abs(pesoLiquidoInformado - pesos.pesoLiquido) > 0.001;

        if(!divergente) {
            return true;
        }

        const usarCalculado = await SamosUtils.Msg.confirm(
            'Os pesos informados são diferentes dos pesos calculados.<br><br>' +

            '<b>Calculado pelo sistema:</b><br>' +
            'Peso bruto: ' + pesos.pesoBruto.toFixed(3) + ' kg<br>' +
            'Peso líquido: ' + pesos.pesoLiquido.toFixed(3) + ' kg<br><br>' +

            '<b>Informado:</b><br>' +
            'Peso bruto: ' + pesoBrutoInformado.toFixed(3) + ' kg<br>' +
            'Peso líquido: ' + pesoLiquidoInformado.toFixed(3) + ' kg<br><br>' +

            'Deseja utilizar os pesos calculados pelo sistema?'
        );

        if(usarCalculado) {

             const vmMovimento = formMovimento.getViewModel();
             vmMovimento.set('pesoNfeInformadoManual', false);

            model.set(
                'MOVIMENTOSENVIO_PESOBRUTO',
                pesos.pesoBruto
            );

            model.set(
                'MOVIMENTOSENVIO_PESOLIQUIDO',
                pesos.pesoLiquido
            );
        }

        return true;
    },  
    
    onPesoNfeChange: function(txt, newValue, oldValue) {

        if(newValue === oldValue) {
            return;
        }

        const formMovimento = this.getView().up('formmovimentos');

        if(formMovimento) {
            formMovimento.getViewModel().set(
                'pesoNfeInformadoManual',
                true
            );
        }
    }

});
