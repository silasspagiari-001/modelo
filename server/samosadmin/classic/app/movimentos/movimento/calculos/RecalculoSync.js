Ext.define('SamosAdmin.movimentos.movimento.calculos.RecalculoSync', {
    alternateClassName: 'Movimento.calculos.RecalculoSync',
    singleton: true,

    calcular: function (options) {
        const { movimento, produto } = options;

        const fnProduto = Movimento.calculos.Produto.createFnProduto(options);
        const fnCabecalho = Movimento.calculos.Cabecalho.createFnCabecalho(options);

        let result = {};

        //caso a alteração foi feita em um produto específo
        if(produto) {
            result = fnProduto.calcular(options);
        }

        const resultCabecalho = fnCabecalho.calcular(options);
        
        console.log('Calculo finalizado!');
        
        result.movimento  = movimento;
        result.produto    = produto;
        result.senhaNivel = result.senhaNivel || resultCabecalho.senhaNivel;
        result.mensagem   = result.mensagem   || resultCabecalho.mensagem;

        return result;
    }
});
