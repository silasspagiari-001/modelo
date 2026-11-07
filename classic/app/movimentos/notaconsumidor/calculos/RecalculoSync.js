Ext.define('SamosAdmin.movimentos.notaconsumidor.calculos.RecalculoSync', {
    alternateClassName: 'NotaConsumidor.calculos.RecalculoSync',
    singleton: true,

    calcular: function (options) {
        const { movimento, produto } = options;

        const fnProduto   = NotaConsumidor.calculos.Produto.createFnProduto(options);
        const fnCabecalho = NotaConsumidor.calculos.Cabecalho.createFnCabecalho(options);

        let result = {};

        //caso a alteração foi feita em um produto específo
        if(produto) {
            result = fnProduto.calcular(options);
        }

        const resultCabecalho = fnCabecalho.calcular(options);
                
        result.movimento  = movimento;
        result.produto    = produto;
        result.senhaNivel = result.senhaNivel || resultCabecalho.senhaNivel;
        result.mensagem   = result.mensagem   || resultCabecalho.mensagem;

        return result;
    }
});
