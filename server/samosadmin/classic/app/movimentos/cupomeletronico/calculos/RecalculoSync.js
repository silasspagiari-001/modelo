Ext.define('SamosAdmin.movimentos.cupomeletronico.calculos.RecalculoSync', {
    alternateClassName: 'CupomEletronico.calculos.RecalculoSync',
    singleton: true,

    calcular: function (options) {
        const { movimento, produto } = options;

        const fnProduto   = CupomEletronico.calculos.Produto.createFnProduto(options);
        const fnCabecalho = CupomEletronico.calculos.Cabecalho.createFnCabecalho(options);

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
