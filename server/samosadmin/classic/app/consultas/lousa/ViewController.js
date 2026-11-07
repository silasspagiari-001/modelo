Ext.define('SamosAdmin.consultas.lousa.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.lousa',

    initViewModel: async function () {
        const form = this.getView();

        try {

            const tabpanel = Ext.$('samosviewport')[0].down('tabpanel');
            const newModel = Ext.create('SamosAdmin.movimentos.movimento.Model');

            newModel.set(newModel.getIdProperty(), 0);

            this.cleanChilds();

            form.model = newModel;

            form.getViewModel().set({
                model: newModel,
                initialValues: {},
                readOnly: false,
                previousModel: {}
            });

            SamosUtils.Events.enableWarnReload();

            if (tabpanel) {
                tabpanel.setActiveTab(form);
            }

            this.doDefaultFocus();

            await Movimento.services.Model.definirValoresPadrao(form, 'Requisições');

        } catch (error) {
            SamosUtils.Msg.error(error, 'Erro ao abrir nova lousa');
        }
    },


    adicionarProdutos: function (produtos) {

        const grid = this.lookup('produtos');
        const store = grid ? grid.getStore() : null;

        if (!store || !produtos || !produtos.length) {
            return;
        }

        const duplicados = [];
        let incluidos = 0;

        Ext.Array.each(produtos, function (produtoOrigem) {

            const produto = produtoOrigem.get ? produtoOrigem : null;
            const dados = produtoOrigem.get ? produtoOrigem.data : produtoOrigem;

            const produtoId = produto
                ? produto.get('PRODUTOS_ID')
                : dados.PRODUTOS_ID;

            // Se o produto já estiver na Lousa, NÃO altera a quantidade
            // e NÃO inclui uma segunda vez. Apenas registra para avisar o usuário.
            let item = store.findRecord(
                'MOVIMENTOSITENS_ID_PRODUTOS',
                produtoId,
                0,
                false,
                true,
                true
            );

            if (item) {
                duplicados.push(
                    produto ? (produto.get('NOME') || produtoId) : (dados.NOME || produtoId)
                );
                return;
            } else {
                const precoParcelado = produto ? produto.get('PRECO') : dados.PRECO;
                const precoVista = produto
                    ? produto.get('PRECOMINIMO')
                    : dados.PRECOMINIMO;
                const precoPromocao = produto ? produto.get('PRAZO') : dados.PRAZO;

                item = store.add({
                    // Não informar MOVIMENTOSITENS_ID aqui. Como ele é o idProperty
                    // do ModelItens, usar 0 em todas as linhas faz o ExtJS tratar
                    // os registros como se tivessem a mesma identidade. Deixando
                    // sem ID, o ExtJS gera um identificador interno único para
                    // cada item novo (phantom).
                    MOVIMENTOSITENS_ID_PRODUTOS: produtoId,
                    PRODUTOS_NOME: produto ? produto.get('NOME') : dados.NOME,
                    PRODUTOS_DESCRICAO: produto
                        ? (produto.get('DESCRICAO') || produto.get('NOME'))
                        : (dados.DESCRICAO || dados.NOME),
                    MOVIMENTOSITENS_QUANTIDADE: 1,

                    // Campos-base usados pela própria Lousa para os cálculos.
                    SALDOS_PRECO: precoParcelado || 0,
                    PRECOMINIMO_DB: precoVista || 0,
                    SALDOS_PRAZO: precoPromocao || 0,

                    // Quantidade inicial = 1, portanto os totais da linha
                    // começam com os próprios preços do produto.
                    MOVIMENTOSITENS_PRECO: (Number(precoParcelado) || 0) / 1000,
                    MOVIMENTOSITENS_BASEICMS: (Number(precoVista) || 0) / 1000,
                    MOVIMENTOSITENS_BASEST: (Number(precoPromocao) || 0) / 1000
                })[0];
                incluidos++;
            }

        });

        // Recalcula cada linha com a mesma regra já utilizada pela Lousa.
        store.each(function (item) {
            const qtde = Number(item.get('MOVIMENTOSITENS_QUANTIDADE')) || 1;
            const parcelado = Number(item.get('SALDOS_PRECO')) || 0;
            const avista = Number(item.get('PRECOMINIMO_DB')) || 0;
            const promocao = Number(item.get('SALDOS_PRAZO')) || 0;

            item.set({
                MOVIMENTOSITENS_PRECO: (qtde * parcelado) / 1000,
                MOVIMENTOSITENS_BASEICMS: (qtde * avista) / 1000,
                MOVIMENTOSITENS_BASEST: (qtde * promocao) / 1000
            });
        });

        this.fazerSomas();

        return {
            incluidos: incluidos,
            duplicados: duplicados
        };
    },

    prepararProduto: function (txt) {

        const grid = txt.up('samoswidgets-griditems');
        const selection = grid.getSelection();

        if (!selection) {
            return;
        }

        const produto = selection.getValues();

        produto.MOVIMENTOSITENS_QUANTIDADE =
            Number(produto.MOVIMENTOSITENS_QUANTIDADE) || 1;

        selection.setValues(produto);

        Ext.defer(function () {
            grid.publicarModel(txt, txt.up('form'));
        }, 200);
    },

    calcularProduto: async function (txt, griditems) {

        const selection = griditems.getSelection();

        if (!selection) {
            return;
        }

        const produto = selection.getValues();

        const quantidadeTexto = String(produto.MOVIMENTOSITENS_QUANTIDADE || '');

        const qtdeIncompleta =
            quantidadeTexto.endsWith('.') ||
            quantidadeTexto.endsWith('.0') ||
            quantidadeTexto.endsWith('.00');

        if (qtdeIncompleta) {
            return;
        }

        const qtde = grams(produto.MOVIMENTOSITENS_QUANTIDADE);

        const precoParcelado = cents(produto.SALDOS_PRECO);
        const precoVista = cents(produto.PRECOMINIMO_DB);
        const precoPromocao = cents(produto.SALDOS_PRAZO);

        const totalParcelado = Math.round((qtde * precoParcelado) / 100 / 10000);
        const totalVista = Math.round((qtde * precoVista) / 100 / 10000);

        // Mantém o mesmo padrão de arredondamento dos demais
        const totalPromocao = ((qtde * precoPromocao) / 100000);

        produto.MOVIMENTOSITENS_PRECO = totalParcelado / 100;
        produto.MOVIMENTOSITENS_BASEICMS = totalVista / 100;
        produto.MOVIMENTOSITENS_BASEST = totalPromocao / 1000;

        selection.setValues(produto);
    },

    fazerSomas: function () {

        const vm = this.getViewModel();
        const movimento = this.getRecord();
        const store = vm.getStore('produtos');

        if (!movimento || !store) {
            return;
        }

        this.iniciarEdicao();

        let totalParcelado = 0;
        let totalVista = 0;
        let totalPromocao = 0;

        store.each(function (produto) {

            totalParcelado += grams(produto.get('MOVIMENTOSITENS_PRECO') || 0);
            totalVista += grams(produto.get('MOVIMENTOSITENS_BASEICMS') || 0);
            totalPromocao += grams(produto.get('MOVIMENTOSITENS_BASEST') || 0);

        });

        movimento.set({
            PARCELADO_TOTAL: totalParcelado / 1000,
            AVISTA_TOTAL: totalVista / 1000,
            PROMOCAO_TOTAL: totalPromocao / 1000
        });

        vm.notify(); // Garante a atualização dos binds do ViewModel
    },

    onLimparLousaClick: function () {

        const grid = this.lookup('produtos');
        const store = grid ? grid.getStore() : null;

        if (!store || store.getCount() === 0) {
            Ext.Note('warning', 'A Lousa já está vazia');
            return;
        }

        const controller = this;
        store.removeAll();
        controller.fazerSomas();
        Ext.Note('success', 'Lousa limpa');
    },

    onImprimirClick: async function () {

        const view = this.getView();

        try {

            const store = this.lookup('produtos').getStore();

            if (store.getCount() === 0) {
                throw 'Informe pelo menos um produto.';
            }

            view.initGauge('Gerando impressão...');

            const itens = [];

            store.each(function (produto) {

                itens.push({
                    PRODUTOS_ID: produto.get('MOVIMENTOSITENS_ID_PRODUTOS'),
                    QUANTIDADE: produto.get('MOVIMENTOSITENS_QUANTIDADE'),
                    PARCELADO: produto.get('MOVIMENTOSITENS_PRECO'),
                    AVISTA: produto.get('MOVIMENTOSITENS_BASEICMS'),
                    PROMOCAO: produto.get('MOVIMENTOSITENS_BASEST'),
                    DESCRICAO: produto.get('PRODUTOS_DESCRICAO')
                });

            });

            const queryPDF = await SamosUtils.Request.nodeApi({
                url: `/relatorios/${configs.getClientName()}/lousa`,
                method: 'POST',
                data: {
                    usuario: configs.getPermissao()['USUARIOS_LOGIN'],
                    celular: configs.getPermissao()['USUARIOS_CELULAR'],
                    produtos: itens
                }
            });

            await SamosUtils.Utils.sleep(500);

            SamosUtils.Pdf.exibir({
                local: 'tab',
                caminho: queryPDF.results[0].name,
                serverType: 'nodejs'
            });

        } catch (error) {

            SamosUtils.Msg.error(error, 'Falha ao imprimir');

        } finally {

            view.stopGauge();

        }
    }

});