Ext.define('SamosAdmin.movimentos.notaservicos.services.ImportacaoExportacao', {
    alternateClassName: 'NotaServicos.services.ImportacaoExportacao',
    singleton: true,

    /**
     * Importação
     */

    deXML: async function(filefield) {
        try {
            const selection = filefield.getEl().query('input[type="file"]')[0];
            
            this.downloadPath = null;
    
            if(!selection || selection.files.length == 0) {
                this.limparFileField();
                throw 'Selecione o arquivo XML';
            }

            const view = Ext.$('formnotaservicos')[0];
            view.initGauge('Importando...');

            blobFile = new Blob(selection.files, { type: '.xml;charset=utf8' });
            await this.enviarArquivo(blobFile);
            await this.carregarNotaImportada();
            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao importar XML');
        }

        this.limparFileField();
        Ext.MessageBox.hide();
        Ext.$('formnotaservicos')[0].stopGauge();
    },

    limparFileField: function() {
        const formMovimento = Ext.$('formnotaservicos')[0];
        const filefield = formMovimento.lookup('carregarxml').getEl().query('input[type="file"]')[0];
        filefield.value = '';
    },

    enviarArquivo: async function (blobFile) {
        this.txtXML = await new Promise(resolve => {
            const reader = new FileReader();
            reader.addEventListener('loadend', e => resolve(e.srcElement.result));
            reader.readAsText(blobFile);
        });
    },

    carregarNotaImportada: async function() {
        const view = Ext.$('formnotaservicos')[0];
        const vm   = view.getViewModel();
        const ctrl = view.getController();

        const queryXML = await SamosUtils.Request.nodeApi({
            url: `/processos/notaservicos/importaxmlnotaservicos`,
            method: 'POST',
            data: {
                xml: this.txtXML.replace(/�/ig, '')
            }
        });

        const retorno = queryXML[0] ? queryXML[0].get('caminho') : queryXML.caminho;
        const status  = queryXML[0] ? queryXML[0].get('status')  : queryXML.status;
        const id      = retorno;
        
        const notasservicos = id == '9999999' || isNaN(id) ? null : await NotaServicos.services.Model.get(id);

        if(!notasservicos || !notasservicos[0]) {
            throw status;
        }

        const movimento = notasservicos[0];
        
        vm.set('model', movimento);
        Ext.Note('success', status);

        if(ctrl.getListView.call(ctrl)) {
            ctrl.getListView.call(ctrl).getViewModel().getStore('main').add(movimento);
        }
        
        view.applyTextSearches();
    },

    deOrdemServico: function(btnImportar) {
        this.fazerImportacaoPadrao({
            title: 'Ordem Serviço',
            btnImportar: btnImportar,
            importaMultiplos: true,
            permitirApenasDeUmaPessoa: true,
            permitirApenasDeUmaEmpresa: true
        });
    },

    fazerImportacaoPadrao: function(deps) {
        const form = Ext.$('formnotaservicos')[0];
        const formTitle = form.title;
        const novo = form.model;
        
        return deps.btnImportar.openSearch({
            title: deps.title,
            tabela: 'ordenseleve',
            proximoFoco: 'pessoa',
            multi: deps.importaMultiplos,
            permitirApenasDeUmaEmpresa: deps.permitirApenasDeUmaEmpresa,
            permitirApenasDeUmaPessoa: deps.permitirApenasDeUmaPessoa,
            valueStatus: 5
        })
        .then(this.obterOSCompletas)
        .then(this.guardarOriginaisParaAtualizar)
        .then(originais => {
            const models = [novo, originais];
            return models;
        }) 
        .then(this.agruparOriginais)
        .then(this.copiarCamposDoOriginal) 
        .then(this.setarCamposDePesquisa)
        .then(this.ajustarOperacaoItens)
        .then(models => {
            return models;
        })
        .catch(e => console.error(e));
    },

    agruparOriginais: function(models) { 
        const [novo, originais] = models;
        const numeroDeOSAgrupadas = originais.length;
        const resetarIdsFn = NotaServicos.services.Filhos.resetarIds;
        
        return [novo, originais.reduce((result, original) => {
            const agrupado = Ext.create('SamosAdmin.movimentos.notaservicos.Model', result.data);
            const desconto = cents(agrupado.get('ORDENS_DESCONTOS')) + cents(original.get('ORDENS_DESCONTOS'));
            const total =    cents(agrupado.get('ORDENS_TOTAL'))     + cents(original.get('ORDENS_TOTAL'));

            agrupado.set('ORDENS_SERVICOSITENS',      (agrupado.get('ORDENS_SERVICOSITENS') || []).concat((original.get('ORDENS_SERVICOSITENS') || [])));

            agrupado.set({
                'ORDENS_ID_EMPRESAS': agrupado.get('ORDENS_ID_EMPRESAS'),
                'ORDENS_NUMERO':     numeroDeOSAgrupadas > 1 ? 99999 : agrupado.get('ORDENS_NUMERO'),
                'ORDENS_SERIE':      agrupado.get('ORDENS_SERIE'),
                'ORDENS_DESCONTOS':  desconto / 100,
                'ORDENS_SERVICOS':   (cents(agrupado.get('ORDENS_SERVICOS'))  + cents(original.get('ORDENS_SERVICOS')))  / 100,
                'ORDENS_TOTAL':      total / 100,
                'ORDENS_SERVICOSITENS': resetarIdsFn(agrupado, 'ORDENS_SERVICOSITENS', 'ORDENSSERVICOS_ID')
            });

            return result;
        })];
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
                if((novo && novo.get('ORDENS_STATUS') != 'F') || !novo){
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
                'ORDENS_ID_USUARIOS': original.get('ORDENS_ID_USUARIOS'),
                'USUARIOS_NOME'         : original.get('USUARIOS_NOME'),
                'USUARIOS_LOGIN'        : original.get('USUARIOS_LOGIN')
            });    
        }
        
        novo.set({
            'ORDENS_ID_PRAZOS': original.get('ORDENS_ID_PRAZOS'),
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
        const formMovimento = Ext.$('formnotaservicos')[0];
        const campoPessoa = formMovimento.lookup('pessoa');
        const resetarIdsFn = NotaServicos.services.Filhos.resetarIds;

        campoPessoa.suspendEvents();//para não apagar os campos trazidos ao mudar o id
        
        novo.set({
            'ORDENS_ID_EMPRESAORIGEM': original.get('ORDENS_ID_EMPRESAS'),
            'ORDENS_NUMEROORIGEM':     original.get('ORDENS_NUMERO'),
            'ORDENS_SERIEORIGEM':      original.get('ORDENS_SERIE'),
            'ORDENS_ID_PESSOAS':       original.get('ORDENS_ID_PESSOAS'),
            'ORDENS_NOME':             original.get('ORDENS_NOME'),
            'ORDENS_ID_USUARIOS':      original.get('ORDENS_ID_USUARIOS'),
            'USUARIOS_NOME':           original.get('USUARIOS_NOME'),
            'USUARIOS_LOGIN':          original.get('USUARIOS_LOGIN'),
            'ORDENS_ID_PRAZOS':        original.get('ORDENS_ID_PRAZOS'),
            'PRAZOS_NOME':             original.get('PRAZOS_NOME'),
            'ORDENS_CPFCNPJ':          original.get('ORDENS_CPFCNPJ'),
            'PESSOAS_ENDERECO':        original.get('PESSOAS_ENDERECO'),
            'PESSOAS_NUMERO':          original.get('PESSOAS_NUMERO'),
            'PESSOAS_ID_CIDADES':      original.get('PESSOAS_ID_CIDADES'),
            'PESSOAS_TELEFONE':        original.get('PESSOAS_TELEFONE'),
            'PESSOAS_OBSERVACOES':     original.get('PESSOAS_OBSERVACOES'),
            'PESSOAS_CREDITO':         original.get('PESSOAS_CREDITO'),
            'PESSOAS_PAGINA':          original.get('PESSOAS_PAGINA'),
            'ORDENS_CELULAR':          original.get('ORDENS_CELULAR'),
            'CIDADES_NOME':            original.get('CIDADES_NOME'),
            'CIDADES_ESTADO':          original.get('CIDADES_ESTADO'),
            'ORDENS_EMAIL':            original.get('ORDENS_EMAIL'),
            'ORDENS_DESCONTOS':        original.get('ORDENS_DESCONTOS'),
            'ORDENS_PERCENTUAL':       original.get('ORDENS_PERCENTUAL'),
            'ORDENS_SERVICOS':         original.get('ORDENS_SERVICOS'),
            'ORDENS_TOTAL':            original.get('ORDENS_TOTAL'),
            'ORDENS_OBSERVACOES':      original.get('ORDENS_OBSERVACOES'),
            'ORDENS_SERVICOSITENS':    resetarIdsFn(original, 'ORDENS_SERVICOSITENS', 'ORDENSSERVICOS_ID'),
        });

        const itensNovo = novo.get(`ORDENS_SERVICOSITENS`)

        //faz a junção de itens repetidos

        let numeroOsCabecalho = '';

        const itensAgrupados = itensNovo.reduce((res, item) => {

            const existente = res.find(r => r['ORDENSSERVICOS_ID_SERVICOS'] == item['ORDENSSERVICOS_ID_SERVICOS']);
            let numeroOs = '';
            
            if(!existente) {
                let descriServico = (item['SERVICOS_DESCRICAO']||[]).split('|')[1];
                numeroOs = item['ITEM_NUMEROOS'].toString();
                numeroOsCabecalho += (numeroOs + ', ');                
                if(descriServico) {
                    item['ORDENSSERVICOS_DESCRITIVO'] = `PRESTAÇÃO DE SERVIÇO COM ${descriServico} - OS: ${numeroOs}`;
                }
                res.push(item);
            } else {
                numeroOs = item['ITEM_NUMEROOS'].toString();  
                if(existente['ORDENSSERVICOS_DESCRITIVO'].includes(numeroOs)) {
                    // Se já tem não insere na lista
                } else {
                    existente['ORDENSSERVICOS_DESCRITIVO'] = existente['ORDENSSERVICOS_DESCRITIVO'] + `, ${numeroOs}`;
                    numeroOsCabecalho += (numeroOs + ', ');
                }
                
                existente['ORDENSSERVICOS_QUANTIDADE'] = ((grams(existente['ORDENSSERVICOS_QUANTIDADE']) + grams(item['ORDENSSERVICOS_QUANTIDADE'])) / 1000);
                existente['VALOR_LIQUIDO']             = ((cents(existente['VALOR_LIQUIDO'])              + cents(item['VALOR_LIQUIDO'])) / 100);
                existente['TOTAL_LIQUIDO']             = ((cents(existente['TOTAL_LIQUIDO'])              + cents(item['TOTAL_LIQUIDO'])) / 100);
                existente['ORDENSSERVICOS_TOTAL']      = parseFloat(((cents(existente['ORDENSSERVICOS_TOTAL']) + cents(item['ORDENSSERVICOS_TOTAL'])) / 100).toFixed(2));
                existente['ORDENSSERVICOS_PRECO']      = parseFloat(((cents(existente['ORDENSSERVICOS_TOTAL']) / grams(existente['ORDENSSERVICOS_QUANTIDADE'])) * 10).toFixed(2));
            }

            return res;
            
        }, []);

        // Fim da junção.

        novo.set(`ORDENS_SERVICOSITENS`, itensAgrupados);
        novo.set('ORDENS_IDENTIFICACAO', numeroOsCabecalho.slice(0, -2));

        Ext.defer(campoPessoa.resumeEvents, 500, campoPessoa);

        return [ novo, original ];
    },

    setarCamposDePesquisa: function(models) {
        const [novo, original] = models;
        const campoPessoa = Ext.$('formnotaservicos')[0].lookup('pessoa');
        const campoVendedor = Ext.$('formnotaservicos')[0].lookup('vendedor');
        const pessoa = (original.get('ORDENS_NOME') ? original.get('ORDENS_NOME') : original.get('ORDENS_NOME'));
        const vendedor = novo.get('USUARIOS_NOME');

        campoPessoa.setSearchedId(pessoa);
        campoVendedor.setSearchedId(vendedor);
        
        return [ novo, original ];
    },

    ajustarOperacaoItens: function(models) {
        const [novo, original] = models;
        
        (novo.get('ORDENS_SERVICOSITENS') || []).forEach(item => {
            item['ORDENSSERVICOS_ID_OPERACOES'] = 593300;
        });
        
        return [ novo, original ];
    },

    obterOSCompletas: async function(originais) {

        const form = Ext.$('formnotaservicos')[0]

        form.initGauge();

        const ids = originais.reduce((result, ordem) => {
            return result += ordem.get('ORDENS_ID') + ',';
        }, '').slice(0,-1);

        const ordens = await Ordemeleve.services.Model.get(ids) 

        form.getViewModel().set('ordensOriginais', ordens);

        form.stopGauge();

        return ordens;
    },

    guardarOriginaisParaAtualizar: function(originais) {
        const form = Ext.$('formnotaservicos')[0];
        form.getViewModel().set('ordensOriginais', originais);
        return originais;
    },

    atualizarOriginais: function(novo, originais, ctrlNotaServico) {
        const numeroDeOSAgrupadas = originais.length;
        
        originais.forEach((original, index) => {
            if(original.get('ORDENS_NUMERO') == 99999) { // Atualiza só os dados básicos abaixo
                SamosUtils.Request.nodeApi({
                    url: `/ordenseleve/${original.get('ORDENS_ID')}`,
                    method: 'PUT',
                    data: {
                        'ORDENS_FECHAMENTO':     momentServer().format('YYYY-MM-DD'),
                        'ORDENS_STATUS':           'F',
                        'ORDENS_ID_EMPRESAORIGEM': novo.get('ORDENS_ID_EMPRESAS'),
                        'ORDENS_NUMEROORIGEM':     novo.get('ORDENS_NUMERO'),
                        'ORDENS_SERIEORIGEM':      novo.get('ORDENS_SERIE')        
                    }
                });
                return;
            }
            original.set({
                'ORDENS_FECHAMENTO':     momentServer().format('YYYY-MM-DD'),
                'ORDENS_STATUS':           'F',
                'ORDENS_ID_EMPRESAORIGEM': novo.get('ORDENS_ID_EMPRESAS'),
                'ORDENS_NUMEROORIGEM':     novo.get('ORDENS_NUMERO'),
                'ORDENS_SERIEORIGEM':      novo.get('ORDENS_SERIE')
            });

            original.save()
                .then(() => {
                    if(index == numeroDeOSAgrupadas - 1) {
                        ctrlNotaServico.getViewModel().set('ordensOriginais', false);
                        setTimeout(() => {
                            ctrlNotaServico.onGravacaoSucesso.call(ctrlNotaServico, novo);
                        }, 200);
                    }
                })
                .catch(error => {
                    ctrlNotaServico.onGravacaoFalha.call(ctrlNotaServico, error);
                    ctrlNotaServico.aposGravar.call(ctrlNotaServico);
                });
        });
    }

});
