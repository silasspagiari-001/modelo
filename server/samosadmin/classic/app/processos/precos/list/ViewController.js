Ext.define('SamosAdmin.processos.precos.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.processosprecos',

    initViewModel: function(vm) {
        //seta por padrao a primeira opcao ativa do combo (trazida do config)
        vm.set(
            'valueAtualizar', 
            configs.getProdutos().atualizaPreco.filter(opcao => opcao.ativo)[0].field
        );
    },

    onChangeAjusteTipo: function(field){
        const vm = this.getViewModel();
        //Atualiza a ooção de ajuste no view model
        vm.set({
            'valueAcresDecrescimo': field.selection.data.field1
        });

        //Chama a função pra atualizar a exibição
        this.onChangePercentual();
    },

    getServerUrl: function() {
        return 'server/processos/produtos/alterarprecos';
    },

    onBuscarClick: async function() {
        var vm = this.getViewModel();

        if(!vm.get('valueIdGrupo') && !vm.get('valueIdFornecedor')) {
            Ext.Note('warning', 'Informe fornecedor ou grupo');
        } else {
            //apos fazer a busca, reseta tudo
            const todosProdutos = await this.callParent(arguments);
            vm.set('valuePercentual', 0);
            this.getView().down('grid').getSelectionModel().deselectAll();
            this.limparCalculos(todosProdutos);
        }
    },

    getBuscarParams: function () {
        var vm = this.getViewModel();

        return {
            empresa   : configs.getEmpresa().id,
            grupo     : vm.get('valueIdGrupo'),
            fornecedor: vm.get('valueIdFornecedor')
        };
    },

    onBeforeItemClick: function (grid, record, item, index) {
        //ao selecionar/deselecionar um produto, recalcula só ele
        Ext.asap(() => {
            this.limparCalculos([record]);
            if(grid.getSelectionModel().isSelected(record)) {
                this.recalcular([record]);
            }
        });
    },

    onSelectionChange: function (selModel, records) {
        const todosProdutos = this.getView().down('grid').getStore().getData().items;

        if(todosProdutos.length == records.length) {
            //caso selecione todos, recalcula tudo
            Ext.asap(() => {
                this.limparCalculos(todosProdutos);
                this.recalcular(todosProdutos);
            });
        } else if(records.length == 0) {
            //caso descelecione todos, limpa tudo
            Ext.asap(() => this.limparCalculos(todosProdutos));
        }
    },

    onChangeAtualizar: function() {
        //ao mudar o combo de atualização limpa os calculos e deseleciona tudo
        Ext.asap(() => {
            const selecionados = this.getView().down('grid').getSelectionModel().getSelection();

            this.limparCalculos(selecionados);
            this.getView().down('grid').getSelectionModel().deselectAll();
            this.getViewModel().set('valuePercentual', 0);
        });
    },

    onChangePercentual: async function() {
        const selecionados = this.getView().down('grid').getSelectionModel().getSelection();
        this.recalcular(selecionados);
    },

    limparCalculos: function(produtos) {
        produtos.forEach(produto => {
            produto.set({
                'NOVO_COMISSAO'    : 0,
                'NOVO_MARKUP'      : 0,
                'NOVO_CUSTO'       : 0,
                'NOVO_MARGEM'      : 0,
                'NOVO_MARGEMMINIMA': 0,
                'NOVO_PRECOMINIMO' : 0,
                'NOVO_PRECO'       : 0,
                'NOVO_PRAZO'       : 0,
                'NOVO_FRETE'       : 0,
                'NOVO_DESPESAS'    : 0,
                'NOVO_TRANSFERENCIA' : 0
            });
        });
    },

    recalcular: async function(produtos) {
        Ext.asap(() => {
            const vm         = this.getViewModel();
            const atualizar  = vm.get('valueAtualizar');
            const percentual = cents(vm.get('valuePercentual'));
            const recalcular = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == atualizar).recalcular;
           
            const opcoes     = { 
                produtos  : produtos, 
                percentual: percentual, 
                recalcular: recalcular 
            };
    
            if(atualizar == 'SALDOS_COMISSAO') {
                this.atualizarComissao(opcoes);
    
            } else if(atualizar == 'SALDOS_MARKUP') {
                this.atualizarMarkup(opcoes);
    
            } else if(atualizar == 'SALDOS_CUSTO') {
                this.atualizarCusto(opcoes);
    
            } else if(atualizar == 'SALDOS_MARGEM') {
                this.atualizarMargem(opcoes);
    
            } else if(atualizar == 'SALDOS_PRECO') {
                this.atualizarPreco(opcoes);
    
            } else if(atualizar == 'SALDOS_PRAZO') {
                this.atualizarPrazo(opcoes);
    
            } else if(atualizar == 'SALDOS_MARGEMMINIMA') {
                this.atualizarMargemMinima(opcoes);
    
            } else if(atualizar == 'SALDOS_PRECOMINIMO') {
                this.atualizarPrecoMinimo(opcoes);
            }
        });
    },

    atualizarComissao: function({ produtos, percentual }) {
        produtos.forEach(produto => {
            produto.set('NOVO_COMISSAO', percentual / 100);

            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEM'];
            delete produto.data['NOVO_MARGEMMINIMA'];
            delete produto.data['NOVO_PRECOMINIMO'];
            delete produto.data['NOVO_PRECO'];
            delete produto.data['NOVO_PRAZO'];
            delete produto.data['NOVO_FRETE'];
            delete produto.data['NOVO_DESPESAS'];
            delete produto.data['NOVO_TRANSFERENCIA'];
        });
    },

    atualizarMarkup: function({ produtos, percentual }) {
        produtos.forEach(produto => {
            produto.set('NOVO_MARKUP', percentual / 100);

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEM'];
            delete produto.data['NOVO_MARGEMMINIMA'];
            delete produto.data['NOVO_PRECOMINIMO'];
            delete produto.data['NOVO_PRECO'];
            delete produto.data['NOVO_PRAZO'];
            delete produto.data['NOVO_FRETE'];
            delete produto.data['NOVO_DESPESAS'];
            delete produto.data['NOVO_TRANSFERENCIA'];

        });
    },

    atualizarCusto: function({ produtos, percentual, recalcular }) {
        const recalculoPreco = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == 'SALDOS_PRECO').recalcular;

        produtos.forEach(produto => {
            const custoOriginal = cents(produto.get('SALDOS_CUSTO'));
            let custo;

            //TODO: DE ACORDO COM A OPÇÂO, SE È ACRESCIMO/DECRESCIMO, AJUSTA O CUSTO
            //custo = Math.round((custoOriginal * (10000 + percentual)) / 10000) / 100;

            //Se for acrescimo
            if( this.getViewModel().get('valueAcresDecrescimo') == '0' ) 
            {
                custo = Math.round((custoOriginal * (10000 + percentual)) / 10000) / 100;

            //Se for decrescimo
            }else{
                custo = Math.round((custoOriginal * (10000 - percentual)) / 10000) / 100;
            }

            produto.set('NOVO_CUSTO', custo);

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_MARGEM'];
            delete produto.data['NOVO_MARGEMMINIMA'];
            delete produto.data['NOVO_TRANSFERENCIA'];

            if(recalcular['SALDOS_PRECO']) {
                const margem = cents(produto.get('SALDOS_MARGEM')) / 100;//apenas para calculo no eval
                const vista  = Math.round(eval(configs.getProdutos().calculoPreco.vista) * 100) / 100;
                produto.set('NOVO_PRECO', vista);

                if(recalculoPreco['SALDOS_PRAZO']) {
                    const prazo  = Math.round(eval(configs.getProdutos().calculoPreco.prazo) * 100) / 100;
                    produto.set('NOVO_PRAZO', prazo);
                } else {
                    delete produto.data['NOVO_PRAZO'];
                }

            } else {
                delete produto.data['NOVO_PRECO'];
            }

            if(recalcular['SALDOS_PRECOMINIMO']) {
                const margem = cents(produto.get('SALDOS_MARGEMMINIMA')) / 100;//apenas para calculo no eval
                const precoMinimo = Math.round(eval(configs.getProdutos().calculoPreco.vista) * 100) / 100;
                produto.set('NOVO_PRECOMINIMO', precoMinimo);
            } else {
                delete produto.data['NOVO_PRECOMINIMO'];
            }
        });
    },

    atualizarMargem: function({ produtos, percentual, recalcular }) {
        const recalculoPreco = configs.getProdutos().atualizaPreco.find(opcao => opcao.field == 'SALDOS_PRECO').recalcular;

        produtos.forEach((produto, index) => {
            const margem = percentual / 100;
            
            produto.set('NOVO_MARGEM', margem);

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEMMINIMA'];
            delete produto.data['NOVO_PRECOMINIMO'];
            delete produto.data['NOVO_TRANSFERENCIA'];

            if(recalcular['SALDOS_PRECO']) {
                const custo  = cents(produto.get('SALDOS_CUSTO')) / 100;//apenas para calculo no eval
                const vista  = Math.round(eval(configs.getProdutos().calculoPreco.vista) *100) / 100;
                
                produto.set('NOVO_PRECO', vista);
                
                if(recalculoPreco['SALDOS_PRAZO']) {
                    const prazo  = Math.round(eval(configs.getProdutos().calculoPreco.prazo) * 100) / 100;
                    produto.set('NOVO_PRAZO', prazo);
                } else {
                    delete produto.data['NOVO_PRAZO'];
                }
            } else {
                delete produto.data['NOVO_PRECO'];
            }
        });
    },

    atualizarPreco: function({ produtos, percentual, recalcular }) {
        produtos.forEach(produto => {
            const precoAnterior = cents(produto.get('SALDOS_PRECO'));
            //const preco = Math.round((precoAnterior * (10000 + percentual)) / 10000) / 100;
            let preco;
            //Se for acrescimo
            if( this.getViewModel().get('valueAcresDecrescimo') == '0' ) 
            {
                preco = Math.round((precoAnterior * (10000 + percentual)) / 10000) / 100;

            //Se for decrescimo
            }else{
                preco = Math.round((precoAnterior * (10000 - percentual)) / 10000) / 100;
            }

            produto.set('NOVO_PRECO', preco);

            if( configs.getClientName() == 'prudenaco' ){
                //Sinaliza que vai atualizar o SALDOS_TRANSFERENCIA para atualizar o preço por barra
                produto.set('NOVO_TRANSFERENCIA', cents(preco * (produto.get('PRODUTOS_PESOLIQUIDO') || 1) ) / 100 );

            }else{
                delete produto.data['NOVO_TRANSFERENCIA'];
            }

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEMMINIMA'];
            delete produto.data['NOVO_PRECOMINIMO'];

            if(recalcular['SALDOS_MARGEM']) {
                const custo  = cents(produto.get('SALDOS_CUSTO')) / 100;//apenas para calculo no eval
                const vista  = preco;//apenas para calculo no eval
                const margem = Math.round(eval(configs.getProdutos().calculoPreco.margem) * 100) / 100;
                produto.set('NOVO_MARGEM', margem);
            } else {
                delete produto.data['NOVO_MARGEM'];
            }

            if(recalcular['SALDOS_PRAZO']) {
                const vista = preco;//apenas para calculo no eval
                const prazo = Math.round(eval(configs.getProdutos().calculoPreco.prazo) * 100) / 100;
                produto.set('NOVO_PRAZO', prazo);
            } else {
                delete produto.data['NOVO_PRAZO'];
            }
        });
    },

    atualizarPrazo: function({ produtos, percentual }) {
        produtos.forEach(produto => {
            const prazoAnterior = cents(produto.get('SALDOS_PRAZO'));
            const prazo = Math.round((prazoAnterior * (10000 + percentual)) / 10000) / 100;
            
            produto.set('NOVO_PRAZO', prazo);

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEM'];
            delete produto.data['NOVO_MARGEMMINIMA'];
            delete produto.data['NOVO_PRECOMINIMO'];
            delete produto.data['NOVO_PRECO'];
            delete produto.data['NOVO_TRANSFERENCIA'];
        });
    },

    atualizarMargemMinima: function({ produtos, percentual, recalcular }) {
        produtos.forEach(produto => {
            const margem = percentual / 100;

            produto.set('NOVO_MARGEMMINIMA', margem);

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEM'];
            delete produto.data['NOVO_PRECO'];
            delete produto.data['NOVO_PRAZO'];
            delete produto.data['NOVO_TRANSFERENCIA'];

            if(recalcular['SALDOS_PRECOMINIMO']) {
                const custo       = cents(produto.get('SALDOS_CUSTO')) / 100;//apenas para calculo no eval
                const precoMinimo = Math.round(eval(configs.getProdutos().calculoPreco.vista) * 100) / 100;
                produto.set('NOVO_PRECOMINIMO', precoMinimo);
            } else {
                delete produto.data['NOVO_PRECOMINIMO'];
            }
        });
    },

    atualizarPrecoMinimo: function({ produtos, percentual, recalcular }) {
        produtos.forEach(produto => {
            const precoMinAnterior = cents(produto.get('SALDOS_PRECOMINIMO'));
            const precoMinimo      = Math.round((precoMinAnterior * (10000 + percentual)) / 10000) / 100;
            
            produto.set('NOVO_PRECOMINIMO', precoMinimo);

            delete produto.data['NOVO_COMISSAO'];
            delete produto.data['NOVO_MARKUP'];
            delete produto.data['NOVO_CUSTO'];
            delete produto.data['NOVO_MARGEM'];
            delete produto.data['NOVO_PRECO'];
            delete produto.data['NOVO_PRAZO'];
            delete produto.data['NOVO_TRANSFERENCIA'];

            if(recalcular['SALDOS_MARGEMMINIMA']) {
                const custo  = cents(produto.get('SALDOS_CUSTO')) / 100;//apenas para calculo no eval
                const vista  = precoMinimo;//apenas para calculo no eval
                const margem = Math.round(eval(configs.getProdutos().calculoPreco.margem) * 100) / 100;
                produto.set('NOVO_MARGEMMINIMA', margem);
            } else {
                delete produto.data['NOVO_MARGEMMINIMA'];
            }
        });
    },

    onProcessarClick: async function(){
        const selecionados = this.getView().down('grid').getSelectionModel().getSelection();

        if(selecionados.length == 0) {
            Ext.Note('warning', 'Selecione os produtos que deseja alterar');

        } else if(await SamosUtils.Msg.confirm('Processar alterações?')) {
            this.getView().initGauge(); 

            try {
                await SamosUtils.Request.nodeApi({
                    url: '/processos/produtos/alterarprecos',
                    method: 'POST',
                    data: selecionados.map(produto => produto.data)
                });

                Ext.Note('success', 'Produtos alterados com sucesso');
                this.onBuscarClick();
                
            } catch (error) {
                console.error(error);
                Ext.Note('warning', 'Falha ao processar alterações');
            }

            this.getView().stopGauge();
        }
    },

    onImprimirClick: async function() {
        const view    = this.getView();
        const produtos = view.down('grid').getSelectionModel().getSelection();

        try {
            if(!produtos[0]){
                throw 'Selecione o(s) Produtos(s)';
            }

            if(await SamosUtils.Msg.confirm('Deseja realmente imprimir?')){
                view.initGauge('Gerando impressão...');

                const queryPDF = await SamosUtils.Request.nodeApi({
                    url: `/relatorios/${configs.getClientName()}/alteraprecos`,
                    method: 'POST',
                    data: produtos.map(produto => produto.data),
                    query: {
                        empresacnpj: configs.getEmpresa().cnpj
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
    }

});
