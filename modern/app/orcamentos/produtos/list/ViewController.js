Ext.define('SamosAdminModern.orcamentos.produtos.list.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.orcamentosprodutos',

    onItemClick: async function (dataview, index, target, record, e) {
        const vm = this.getViewModel();

        vm.set({
            'produto' : record,
            'initialValues': Object.assign({}, record.data),
            'hideForm': false
        });

        vm.set('valorPercentual',   Ext.util.Format.currency(record.get('MOVIMENTOSITENS_PERCENTUAL')));
        vm.set('valorDesconto',     Ext.util.Format.currency(record.get('MOVIMENTOSITENS_DESCONTOS')));
        vm.set('valorPrecoLiquido', Ext.util.Format.currency(record.get('VALOR_LIQUIDO')));
        vm.set('valorTotalLiquido', Ext.util.Format.currency(record.get('TOTAL_LIQUIDO')));
    },

    onVoltarClick: function() {
        const main = this.getView().up('main');
        
        main.down('panel').setActiveItem('orcamentosform');
        main.down('container[reference="title"]').setHtml('Orçamento');
        
        const readOnly = this.getViewModel().get('readOnly');
        const status = main.down('panel').getActiveItem().getViewModel().get('model.MOVIMENTOS_STATUS')

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: !readOnly || status != 'N',
            hideAlterar: !readOnly || status != 'N',
            hideGravar : readOnly,
            hideNovo   : true
        });
    },

    onNovoClick: function () {
        const vm = this.getViewModel();
        const novoProduto = Ext.create('SamosAdminModern.orcamentos.ModelItens');

        novoProduto.set('MOVIMENTOSITENS_ID', parseInt(Math.random() * -10000))
        
        vm.set({
            'produto' : novoProduto,
            'initialValues': null,
            'hideForm': false
        });

        vm.set('valorPercentual',   '0,00');
        vm.set('valorDesconto',     '0,00');
        vm.set('valorPrecoLiquido', '0,00');
        vm.set('valorTotalLiquido', '0,00');
    },

    onExcluirClick: async function () {
        const vm = this.getViewModel();

        if(await SamosUtils.Msg.confirm('Deseja realmente excluir o produto?')) {
            vm.getStore('main').remove(vm.get('produto'));
            vm.set('model.MOVIMENTOS_ITENS', vm.getStore('main').getData().items.map(produto => produto.data));
        
            vm.set({
                'produto' : null,
                'initialValues': null,
                'hideForm': true
            });

            this.calcularMovimento();
        }
    },

    onPesquisarClick: function () {
        const main = this.getView().up('main');

        main.down('panel').setActiveItem('orcamentosprodutossearch');
        main.down('container[reference="title"]').setHtml('Produtos');

        main.getViewModel().set({
            hideVoltar : false,
            hideExcluir: true,
            hideAlterar: true,
            hideGravar : true,
            hideNovo   : true
        });
    },

    onRecolherClick: function () {
        this.getViewModel().set('hideForm', true);
    },

    onMaisClick: function () {
        const produto = this.getViewModel().get('produto');
        const qtdeAtual = parseInt(produto.get('MOVIMENTOSITENS_QUANTIDADE'));

        let novaQtde = qtdeAtual + 1;

        if(novaQtde > 0) {
            produto.set('MOVIMENTOSITENS_QUANTIDADE', novaQtde);
        }

        this.calcularProduto();
    },

    onMenosClick: function () {
        const qtdeAtual = parseInt(this.getViewModel().get('produto.MOVIMENTOSITENS_QUANTIDADE'));

        let novaQtde = qtdeAtual - 1;

        if(novaQtde > 0) {
            this.getViewModel().get('produto').set('MOVIMENTOSITENS_QUANTIDADE', novaQtde);
        }

        this.calcularProduto();
    },

    onCancelarClick: function () {
        const vm = this.getViewModel();

        vm.set('hideForm', true);
        vm.get('produto').set(vm.get('initialValues'));

        //remascarar
        this.lookup('percentual').setValue(vm.get('valorPercentual'));
        this.lookup('desconto').setValue(vm.get('valorDesconto'));
    },

    onConfirmarClick: async function () {
        const vm = this.getViewModel();
        const produtos = vm.get('model.MOVIMENTOS_ITENS') || [];
        const produto = vm.get('produto');

        if(
            !produto.get('MOVIMENTOSITENS_ID_PRODUTOS') ||
            !produto.get('MOVIMENTOSITENS_QUANTIDADE')  ||
            produto.get('MOVIMENTOSITENS_QUANTIDADE')  <= 0
        ) {
            return await SamosUtils.Msg.alert('Atenção', 'Informe o produto e a quantidade');
        }

        vm.set('hideForm', true);
        vm.set('initialValues', vm.get('produto').data);

        produto.set({
            'MOVIMENTOSITENS_PERCENTUAL': cents(this.lookup('percentual').getValue()) / 100,
            'MOVIMENTOSITENS_DESCONTOS' : cents(this.lookup('desconto').getValue())   / 100
        })

        //remascarar
        vm.set('valorPercentual', this.lookup('percentual').getValue());
        vm.set('valorDesconto',   this.lookup('desconto').getValue());

        if(produto.phantom) {//se novo
            vm.getStore('main').add(produto);
            produtos.push(produto.data);
            vm.set('model.MOVIMENTOS_ITENS', produtos);
        }

        this.calcularMovimento();
    },

    calcularProduto: function (txt) {
        const vm = this.getViewModel();
        const produto = vm.get('produto');

        const qtde  = produto.get('MOVIMENTOSITENS_QUANTIDADE');
        const preco = produto.get('MOVIMENTOSITENS_PRECO');

        let percentual, desconto;

        if (txt && txt.getLabel() == 'R$ Desconto') {
            desconto   = txt.el.dom.querySelector('input').value.replace(/\./ig, ',').replace(',', '.');
            percentual = Math.round(desconto / (qtde * preco) * 10000) / 100;
        } else {
            percentual = txt ? 
                         txt.el.dom.querySelector('input').value.replace(/\./ig, ',').replace(',', '.') : 
                         produto.get('MOVIMENTOSITENS_PERCENTUAL');
            desconto   = Math.round((qtde * preco) * percentual) / 100;
        }

        const totalLiquido = (qtde * preco) - desconto;
        const precoLiquido = totalLiquido / qtde;

        produto.set({
            'MOVIMENTOSITENS_PERCENTUAL': percentual,
            'MOVIMENTOSITENS_DESCONTOS' : desconto,
            'TOTAL_LIQUIDO'             : totalLiquido,
            'VALOR_LIQUIDO'             : precoLiquido
        });

        //remascarar
        vm.set('valorPercentual',   Ext.util.Format.currency(produto.get('MOVIMENTOSITENS_PERCENTUAL')));
        vm.set('valorDesconto',     Ext.util.Format.currency(produto.get('MOVIMENTOSITENS_DESCONTOS')));
        vm.set('valorPrecoLiquido', Ext.util.Format.currency(produto.get('VALOR_LIQUIDO')));
        vm.set('valorTotalLiquido', Ext.util.Format.currency(produto.get('TOTAL_LIQUIDO')));
    },

    calcularMovimento: function () {
        const movimento = this.getViewModel().get('model');
        const produtos = movimento.get('MOVIMENTOS_ITENS') || [];

        const { totalDesconto, totalProdutos, totalLiquido } = produtos.reduce((totais, produto) => {
            totais.totalDesconto += produto['MOVIMENTOSITENS_DESCONTOS'];
            totais.totalProdutos += produto['TOTAL_LIQUIDO'] + produto['MOVIMENTOSITENS_DESCONTOS'];
            totais.totalLiquido  += produto['TOTAL_LIQUIDO'];
            return totais;
        }, {
            totalDesconto: 0,
            totalProdutos: 0,
            totalLiquido : 0
        });

        movimento.set({
            'MOVIMENTOS_PERCENTUAL': Math.round(totalDesconto / totalProdutos * 10000) / 100,
            'MOVIMENTOS_DESCONTOS' : totalDesconto,
            'MOVIMENTOS_PRODUTOS'  : totalProdutos,
            'MOVIMENTOS_TOTAL'     : totalLiquido
        })
    }
});
