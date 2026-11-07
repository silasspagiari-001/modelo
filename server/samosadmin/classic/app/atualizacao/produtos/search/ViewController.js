Ext.define('SamosAdmin.atualizacao.produtos.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.produtossearch',

    getBuscarParams: function () {
        const vm = this.getViewModel();
        const isMovimento = !!Ext.$('formmovimentos')[0];
        let cfopMovimento = 0;

        if(isMovimento) {
            const form = Ext.$('formmovimentos')[0];
            const movimento = form.getViewModel().get('model') || [];
            cfopMovimento = Number(movimento.get('MOVIMENTOS_ID_OPERACOES'));
        }

        return {
            empresa  : configs.getEmpresa().id,
            conteudo : vm.get('valueConteudo'),
            ordem    : vm.get('valueOrdem'),
            status   : vm.get('valueStatus'),
            pessoa   : vm.get('valuePessoa'),
            tipopreco: configs.getMovimentos().tipoPreco,
            issaida  : cfopMovimento >= 500000 ? 'true' : 'false'
        };
    },

    onItemDblClick: async function (grid, record) {
        const view = this.getView();

        try {
            const txt = view.txt;
            const visible = view.isVisible(true);
    
            const etiquetas   = !!Ext.$('emissaoetiquetas')[0];
            const isMovimento = !!Ext.$('formmovimentos')[0];
            const isEstoque   = !!Ext.$('processosestoque')[0];
            const isProducao  = view.viewOrigin.title == 'Ordem Produção' || view.viewOrigin.title == 'Lotes';
    
            let pessoaSelecionada = '';
            let tipoCusto = '';

            if(isMovimento) {
                const form = Ext.$('formmovimentos')[0];
                const movimento = form.getViewModel().get('model') || [];
                pessoaSelecionada = movimento.get('MOVIMENTOS_ID_PESSOAS');                
            }

    
            if(isEstoque) {
                const form = Ext.$('formmovimentos')[0] || Ext.$('processosestoque')[0];
                const movimento = form.getViewModel().get('model') || [];
                
                pessoaSelecionada = movimento.get('MOVIMENTOS_ID_PESSOAS');
                tipoCusto  = configs.getPessoas().tipoCusto || '';

                const produtosJaInclusos = form.lookup('produtos').getStore().data.items || [];
    
                if(produtosJaInclusos.some(produto => {
                    return produto.get('MOVIMENTOSITENS_ID_PRODUTOS') == record.get('PRODUTOS_ID');
                })) {
                    throw 'Produto já incluído na lista';
                }

                const querySaldoBase = await SamosUtils.Request.nodeApi({
                    url: `/consultas/getsaldoprodutodata`,
                    method: 'GET',
                    data: {
                        produto: record.get('PRODUTOS_ID'), 
                        datasaldo: moment(form.lookup('inicio').getValue()).format('DD/MM/YYYY'),
                    }
                });
                
                record.set('SALDOS_DISPONIVEL', querySaldoBase);
            }

            if(
                configs.getUsuario().login != 'SUPERVISOR' &&
                !isProducao && (
                    (record.get('PRODUTOS_STATUS') == 'F' && !etiquetas) || 
                    record.get('SALDOS_ID') <= 0 || 
                    cents(record.get('SALDOS_PRECO') <= 0)
                )
            ) {
                if(!visible) { Ext.defer(() => txt.focus(true), 400) }
                throw 'Este produto está sem preço ou inativo';
            }
            
            if(isMovimento && !pessoaSelecionada && tipoCusto) {
                if(!visible) { Ext.defer(() => txt.focus(true), 400) }
                throw 'Selecione a pessoa antes de informar os produtos';
            }

/*            if(isMovimento && !pessoaSelecionada && configs.getMovimentos().liberacaoViaSocket) {
                if(!visible) { Ext.defer(() => txt.focus(true), 400) }
                throw 'Selecione a pessoa antes de informar os produtos';
            }*/
            
            if(view.viewOrigin.title == 'Promoção') {
                const vmOrigin = view.viewOrigin.getViewModel();
                const promocaoAtual = vmOrigin.get('model');
                const empresasAtual = Ext.isArray(promocaoAtual.get('PROMOCOES_EMPRESAS')) ?
                                      (promocaoAtual.get('PROMOCOES_EMPRESAS') || []).join('|') :
                                      promocaoAtual.get('PROMOCOES_EMPRESAS');
                if(visible) {
                    view.initGauge('Verificando Promoções...');
                }

                const queryPromocao = await SamosUtils.Request.nodeApi({
                    url: `/consultas/produtopromocao`,
                    method: 'GET',
                    data: {
                        produtos: record.get('PRODUTOS_ID'), 
                        promocao: promocaoAtual.get('PROMOCOES_ID'),
                        empresas: empresasAtual,
                        inicio  : momentTz(promocaoAtual.get('PROMOCOES_EMISSAO')).format('DD/MM/YYYY'),
                        final   : momentTz(promocaoAtual.get('PROMOCOES_VALIDADE')).format('DD/MM/YYYY')
                    }
                });
    
                const promocaoExistente = queryPromocao && queryPromocao.results && queryPromocao.results[0] ? queryPromocao.results[0] : null;

                if(!configs.getMovimentos().promocaoBasica || configs.getMovimentos().carregaPrecoPromocao == true)
                {
                    if(promocaoExistente){
                        throw `Produto já cadastrado na promoção ${promocaoExistente['PROMOCOES_ID']}`;
                    }
                }
            }
                
            this.callParent(arguments);
    
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falha ao selecionar o produto');
        }

        view.stopGauge();
    },

    afterLoadMainStore: function(store, records) {
        var grid = this.getView().down('grid');

        this.callParent(arguments);

        const isMovimento = Ext.$('formmovimentos')[0] ? true : false;
        let tipoCusto = '';
        let tipoPessoa = '';
        let isOrcamento = '';

        if(isMovimento) {
            const form = Ext.$('formmovimentos')[0];            
            const movimento = form.getViewModel().get('model') || [];
            tipoPessoa = movimento.get('PESSOAS_TIPO');
            tipoCusto  = configs.getPessoas().tipoCusto;    
            isOrcamento = (movimento.get('MOVIMENTOS_ID_DOCUMENTOS').toString().slice(-4) == '0001');
        }

        (records || []).forEach(record => {
            Ext.Object.merge(record.data, record.get('SALDOS')[0]);
            Ext.Object.merge(record.data, record.get('NCMS')[0]);
            delete record.data['SALDOS'];
            delete record.data['NCMS'];

            if(configs.getClientName() == 'racaforte') {
                const qtdeOrcamento = grams(record.data['QTDE_ORCAMENTO']);
                const qtdePendencia = grams(record.data['QTDE_PENDENTE']);
                const qtdeSaldoNorm = grams(record.data['SALDOS_DISPONIVEL']); // Sld disponível no BD
                record.data['SALDOS_DISPONIVEL'] = ((qtdeSaldoNorm - qtdeOrcamento - qtdePendencia) / 1000); // Considera ORC/PEN
            }

            if(tipoPessoa == tipoCusto && tipoCusto != '') {
                const preco = cents(record.data['SALDOS_CUSTO']);
                record.data['SALDOS_PRECO'] = preco / 100;
                record.data['SALDOS_PRAZO'] = preco / 100;
                record.data['SALDOS_PRECOMINIMO'] = preco / 100;
            } else {
                const preco = cents(record.data[configs.getMovimentos().tipoPreco == 'vista' ? 'SALDOS_PRECO' : 'SALDOS_PRAZO']);

                if(configs.getMovimentos().descontoMaximo != 'SALDOS_PRECOMINIMO') {
                    if(configs.getUsuario().privilegiado && 
                       configs.getMovimentos().senhaDescontoPrivilegiado === false) {
                        record.data['SALDOS_PRECOMINIMO'] = 0;
                    } else {
                        let descMaximo = 0;
                        if(configs.getClientName() == 'pinguim' && isOrcamento) {
                            descMaximo = (parseInt(configs.getMovimentos().descontoMaximo) + 3);
                        } else {
                            descMaximo = configs.getMovimentos().descontoMaximo;
                        }
                        record.data['SALDOS_PRECOMINIMO'] = (preco - parseInt(preco * (descMaximo || 100) / 100)) / 100
                    }
                }
            }
            
            record.data['SALDOS_DEPOSITO'] = (record.data['SALDOSGERAL'] || []).filter(saldo => {
                return (saldo['EMPRESAS_FANTASIA'] || '').match(/CD/i);
            }).reduce((total, saldo) => {
                return total += saldo['SALDOS_DISPONIVEL'];
            }, 0);

            record.data['SALDOS'] = record.data['SALDOSGERAL'];
        });

        grid.reconfigure(grid.getStore());
    }
});
