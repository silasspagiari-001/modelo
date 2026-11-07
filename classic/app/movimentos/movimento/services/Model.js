Ext.define('SamosAdmin.movimentos.movimento.services.Model', {
    alternateClassName: 'Movimento.services.Model',
    singleton: true,

    get: function(id, params) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            model: 'SamosAdmin.movimentos.movimento.Model',
            proxy: {
                pageParam: '',
                startParam: '',
                limitParam: '',
                url: `server/movimentos/${id}`
            }
        });

        if(params){
            store.getProxy().setExtraParams(params);
        }

        return store.load()
            .then(records => records)
            .catch(() => {
                Ext.Note('error', 'Erro no servidor');
                Ext.$('container')[0].stopGauge();
            });
    },

    existe: function(options) {
        const store = Ext.create('Ext.data.NodeJSStore', {
            proxy: {
                url: 'server/consultas/movimentoexiste'
            }
        });

        store.getProxy().setExtraParams(options);

        return store.load()
            .then(records => records[0])
            .catch(() => Ext.Note('error', 'Erro no servidor'));
    },

    updateUltimoDoctoNFE: function(empresa) {
        empresa = empresa || configs.getEmpresa().id;

        const store = Ext.create('Ext.data.NodeJSStore', {
            proxy: {
                url: 'server/consultas/ultimodocto'
            }
        });

        store.getProxy().setExtraParams({
            docto: (Math.pow(10, (2 - empresa.toString().length)) * empresa) + '003',
            empresa: empresa,
            tabela: 'MOVIMENTOS'
        });

        return store.load().then(records => {
            if(records && records[0]) {
                localStorage.setItem('ultimoNumeroNFE', records[0].get('ULTIMO'));
                localStorage.setItem('ultimaSerieNFE',  records[0].get('SERIE'));
            }
            return records[0];
        });
    },

    updateUltimoDoctoCFE: function(empresa) {
        empresa = empresa || configs.getEmpresa().id;
        
        const store = Ext.create('Ext.data.NodeJSStore', {
            proxy: {
                url: 'server/consultas/ultimodocto'
            }
        });

        store.getProxy().setExtraParams({
            docto: (Math.pow(10, (2 - empresa.toString().length)) * empresa) + '011',
            empresa: empresa,
            tabela: 'MOVIMENTOS'
        });
        
        return store.load().then(records => {
            if(records && records[0]) {
                localStorage.setItem('ultimoNumeroCFE', records[0].get('ULTIMO'));
                localStorage.setItem('ultimaSerieCFE',  records[0].get('SERIE'));
            }
            return records[0];
        });
    },

    atualizarStatusNotaEntrada: function(form) {
        if(form.getViewModel().get('isNotaEntrada')) {
            const movimento = form.getViewModel().get('model');
            const produtos = form.lookup('produtos').getStore().getData().items || [];

            const operacaoCabecalho = movimento.get('MOVIMENTOS_ID_OPERACOES') && movimento.get('OPERACOES_NOME');
    
            if(!operacaoCabecalho) {
                Ext.Note('warning', 'Operação inexistente');
                return false
            }

            const itensSemOperacao = produtos.filter(produto => {
                return !produto.get('MOVIMENTOSITENS_ID_OPERACOES') || !produto.get('OPERACOES_NOME');
            });

            if(itensSemOperacao.length > 0) {
                Ext.Note('warning', `Produto ${itensSemOperacao[0].get('MOVIMENTOSITENS_ID_PRODUTOS')} sem operação`);
                return false
            }

            const implementado = produtos.every(produto => {
                return produto.get('MOVIMENTOSITENS_ID_PRODUTOS') != 999999;
            });

            if(implementado) {
                if(movimento.get('MOVIMENTOS_STATUS') != 'F') {
                    movimento.set('MOVIMENTOS_STATUS', 'G');
                }
            } else {
                movimento.set('MOVIMENTOS_STATUS', 'N');
            }
        }

        return true;
    },

    notaEntradaUnica: function(form) {
        if(!form.getViewModel().get('isNotaEntrada')) { return true; }

        const movimento = form.getViewModel().get('model');
        const pessoa = movimento.get('MOVIMENTOS_ID_PESSOAS');
        const numero = movimento.get('MOVIMENTOS_NUMERO');
        const serie = movimento.get('MOVIMENTOS_SERIE');

        if(movimento.isNew() && pessoa && numero && serie){
            return Movimento.services.Model.existe({ 
                empresa:   movimento.get('MOVIMENTOS_ID_EMPRESAS'),
                documento: movimento.get('MOVIMENTOS_ID_DOCUMENTOS'),
                pessoa:    pessoa,
                numero:    numero,
                serie :    serie
            })
            .then(record => {
                if(record && record.get('MOVIMENTOS_ID') > 0) {
                    Ext.Note('warning', 'Nota de Entrada já lançada!');
                    return false;
                } else {
                    return true;
                }
            });
        } else {
            return true;
        }
    },

    confereChaveNFe: function(form) {
        
        if(!form.getViewModel().get('isNotaEntrada')) { 
            return true; 
        }


        const movimento = form.getViewModel().get('model');
        const cnpPessoa = (movimento.get('PESSOAS_CPFCNPJ') || '').trim();
        const cnpChave = movimento.get('MOVIMENTOS_NFE').substring(6, 20);
        const statusPedido = movimento.get('PEDIDOCOMPRA_STATUS');
        const statusNotaEntrada = movimento.get('MOVIMENTOS_STATUS');
        const isSimplesNacional = configs.getPermissao()['EMPRESAS_SIMPLES'] == 'T' ||
                                  configs.getPermissao()['EMPRESAS_SIMPLES'] == '0';

        if(configs.getMovimentos().pedidoCompraObrigatorio && cnpChave.trim() != '') {
            if((statusPedido && statusPedido != 'N') && (statusNotaEntrada && statusNotaEntrada == 'N')) {
                Ext.Note('warning', 'Pedido de compra já recebido');
                return false;    
            }
        }

        if((cnpChave || '').trim() != '' && cnpPessoa != cnpChave && !isSimplesNacional) {
            Ext.Note('warning', 'Nota de entrada não é desta empresa ou filial');
            return false;
        } else {
            return true;
        }
    },

    confereProducao: function(form) {
        const vm = form.getViewModel();

        if(!configs.getProdutos().lotes) {
           return true;
        }

        if(!vm.get('isNotaEletronica') && 
           !vm.get('isPedidoLote') &&
           !vm.get('isRequisicaoLote')) { return true; }        
        if(vm.get('comLoteLiberado') == true) { return true; }

        let itensSemLote;

        if(configs.getProdutos().lotes) {
            if(configs.getMovimentos().recalculoSync) {
                const itens = form.getController().getRecord()['MOVIMENTOS_ITENS'] || [];
                itensSemLote = itens.filter(item => {            
                    return !item['PRODUTOS_DERIVADO'].match(/T|F/) && item['MOVIMENTOSITENS_ID_LOTES'] == 0;
                });    
            } else {
                const itens = form.down('samoswidgets-griditems').getStore().getData().items || [];
                itensSemLote = itens.filter(item => {            
                    return !(item.get('PRODUTOS_DERIVADO') || '').match(/T|F/) && cents(item.get('MOVIMENTOSITENS_ID_LOTES')) == 0;
                });    
            }
        }

        if(itensSemLote.length > 0) {
            let listaItens = '';
            let msgItens = '';
            if(configs.getClientName().toUpperCase().match(/BIOMART|ORGANOPLANT/)) {
                msgItens = `Há itens de produção sem lote`;
            } else {
                msgItens = `Há produtos que o Lote não foi informado`;
            }
            
            itensSemLote.forEach(produto => {
                listaItens += produto.get('MOVIMENTOSITENS_ID_PRODUTOS') + ', ';
            })

            if(configs.getProdutos().loteObrigatorio) {
                Ext.Note('warning', `Há produtos sem lote: ${listaItens.replace(/,\s*$/, "")}`);
                return false
            } else {
                Ext.Msg.confirm('Confirmação', `${msgItens}: ${listaItens.replace(/,\s*$/, "")} - Continua ?`, confirm => {
                    if (confirm == 'yes') {
                        vm.set('comLoteLiberado', true);
                        return true;
                    } else {
                        return false
                    }
                })
            }

        } else {
            return true;
        }

        return false;
    },

    definirValoresPadrao: async function(form, nomeDocumento, numeroDocumento) {
        if(nomeDocumento.match("Pedido")) {
            if(configs.getClientName() == 'hospitalar') {
                form.model.set('MOVIMENTOS_STATUS',  'N');
            } else if(!configs.getEmpresa().regimeCaixa) {
                form.model.set('MOVIMENTOS_STATUS',  'F');
            }
        }

        if(form.listName != 'Nota Eletrônica') {
            if(configs.getClientName() == 'stilomoveis') {
                form.model.set('MOVIMENTOS_OBSERVACOES',  '');
            }
        }

        if(nomeDocumento.match("Orçamento") && 
           configs.getClientName() == 'prudenmoveis') {
            form.model.set('MOVIMENTOS_ID_PESSOAS',  configs.getEmpresa().id);
        }

        if(nomeDocumento.match("Orçamento") && 
           configs.getClientName() == 'hospitalar') {
            form.model.set('MOVIMENTOS_OBSERVACOES',  'Validade da proposta 10 dias - Frete a combinar|Pagamento fica de acordo com a informação que indicamos|Minimo de faturamento R$100,00||||||');
        }


        if(form.listName == 'Nota Entrada' || form.listName == 'Requisições') {
            form.model.set({
                'MOVIMENTOS_SERIE':        form.listName == 'Nota Entrada' ? 'NFE' : 'REQ',
                'MOVIMENTOS_ENTRADASAIDA': momentServer().format('YYYY-MM-DD'),
                'MOVIMENTOS_HORA':         '00:00:00',
                'MOVIMENTOS_SITUACAO':     configs.getMovimentos().defaultAtualizaEntrada ? configs.getMovimentos().defaultAtualizaEntrada : '0',
                'MOVIMENTOS_ID_USUARIOS':  configs.getUsuario().id,
                'USUARIOS_NOME':           configs.getUsuario().login
            });
        }

        if(form.listName == 'Nota Eletrônica') {

            if(configs.getClientName() == 'stilomoveis') {  // Em teste, multiplos forms abertos - checar sequencia
                const ultimoDocto = numeroDocumento;

                form.model.set({
                    'MOVIMENTOS_NUMERO': isNaN(ultimoDocto) ? '' : (parseInt(ultimoDocto) + 1),
                    'MOVIMENTOS_SERIE': localStorage.getItem('ultimaSerieNFE')
                });    
                

            } else {
                const ultimoDocto = localStorage.getItem('ultimoNumeroNFE');

                form.model.set({
                    'MOVIMENTOS_NUMERO': isNaN(ultimoDocto) ? '' : (parseInt(ultimoDocto) + 1),
                    'MOVIMENTOS_SERIE': localStorage.getItem('ultimaSerieNFE')
                });    
            }
        }

        if(form.listName == 'Transferências') {
            nomeDocumento = 'Transferências Saída';
        }
        
        const documento = await Documento.services.Model.get(nomeDocumento);
        await Movimento.services.Documento.atribuirDocumento(documento, form.model);
        form.applyTextSearches();

        return documento;
    },

    bloquearParaEdicao: function(model, form) {
        if(
            !form || 
            form.getViewModel().get('isNotaEntrada') || 
            form.getViewModel().get('isRequisicaoEntrada') ||
            configs.getClientName() == 'hospitalar'//status hospitalar controlado na importação vtex
        ){ return; }

        let status = model.get('MOVIMENTOS_STATUS');

        if(status == 'C') {
            status = 'B';
        } else if (status == 'N') {
            status = 'M';
        } else if (status == 'F'){
            status = 'E';
        }

        const data = { 'MOVIMENTOS_STATUS': status };
        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .fail(err => console.error(err));
    },

    liberarParaEdicao: function(model, form) {
        if(!form) { return; }
        let status = model.get('MOVIMENTOS_STATUS');

        if(status == 'B') {
            status = 'C';
        } else if (status == 'M') {
            status = 'N';
        } else if (status == 'E'){
            status = 'F';
        }

        const data = { 'MOVIMENTOS_STATUS': status };
        model.set(data);

        SamosUtils.Request.nodeApi({
            url: `/movimentos/${model.get('MOVIMENTOS_ID')}`,
            method: 'PUT',
            data: data
        })
        .fail(err => console.error(err));
    },

    mostrarCusto: function(form){
        const money = Ext.util.Format.MoneyMask.setMask('R$ #9.990,00').mask.bind(Ext.util.Format.MoneyMask);        
        const itens = form.down('samoswidgets-griditems').getStore().getData().items || [];
        const custoProdutos = itens.reduce((result, item) => {
            result += cents(item.get('MOVIMENTOSITENS_CUSTO')) * grams(item.get('MOVIMENTOSITENS_QUANTIDADE')) ;
            return result;
        }, 0);

        Ext.Note('warning', `${money(custoProdutos / 100000)}`);
    },

    mostrarPrecoMinimo: function(form){
        const money = Ext.util.Format.MoneyMask.setMask('R$ #9.990,00').mask.bind(Ext.util.Format.MoneyMask);        
        const produto = form.down('samoswidgets-griditems').getSelection();

        if(produto){
            const values = produto.getValues();
            Ext.Note('warning', `${money(cents(values['SALDOS_PRECOMINIMO']) / 100)}`);
        }
    },

    mostrarComprasPessoa: async function(form){
        const produto = form.down('samoswidgets-griditems').getSelection();

        if(produto){
            const values = produto.getValues();

            if(cents(values['PRODUTOS_ID']) > 0 && cents(form.model.get('MOVIMENTOS_ID_PESSOAS')) > 0) {
                const comprasPessoa = await Movimento.services.Model.buscarComprasPessoaProduto(form.model.get('MOVIMENTOS_ID_PESSOAS'), values['PRODUTOS_ID']);

                const view = Ext.$('formmovimentoscompraspessoa')[0] || Ext.create({
                    xtype: 'formmovimentoscompraspessoa'
                });
    
                view.getViewModel().set({
                    dataComprasPessoa: comprasPessoa
                });
    
                this.getView().add(view);
    
            }
        }
    },

    buscarComprasPessoaProduto: function(pessoa, produto) {

        return new Ext.Promise((resolve, reject) => {
            SamosUtils.Request.nodeApi({
                url: `/consultas/comprasvendaspessoa`,
                method: 'GET',
                data: {
                    empresa: configs.getEmpresa().id,
                    pessoa: pessoa,
                    produto: produto,
                    acao: 'VN',
                    inicio: momentServer().subtract(3, 'year').format('YYYY-MM-DD'),
                    final:  momentServer().format('YYYY-MM-DD'),
                    ordem: 'D'
                }
            })
            .done(res => resolve(res.results))
            .fail(err => reject(err));
        });
    },

    carregarCpfExistente: async function(pessoasId) {
        const formPessoas = Ext.$('formmovimentospessoa')[0];
        const vmPessoas = formPessoas.getViewModel();

        try { Ext.$('note')[0].destroy(); } catch(e) {}

        formPessoas.initGauge();

        const queryPessoa = await SamosUtils.Request.nodeApi({
            url: `/pessoas`,
            method: 'GET',
            query: {
                conteudo: `.${pessoasId}`
            }
        });

        if (queryPessoa.results[0]) {
            vmPessoas.get('model').set(queryPessoa.results[0]);
            vmPessoas.get('model').phantom = false;
//          vmPessoas.set('readOnly', true);
            formPessoas.stopGauge();
            formPessoas.applyTextSearches();
        }
    }

});
