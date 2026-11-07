Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ROMANEIOSITENS_ID',
    idParent: 'ROMANEIOSITENS_ID_ROMANEIOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'ROMANEIOSITENS_STATUS' : 'N',
            'ROMANEIOSITENS_TOTAL'  : 0,
            'ITENS_SELECAO': 'T'
        };

        this.callParent(arguments);
    },

    fields: [
        'ROMANEIOSITENS_ID',                       // INTEGER NOT NULL
        'ROMANEIOSITENS_ID_ROMANEIOS',             // INTEGER NOT NULL
        'ROMANEIOSITENS_ID_MOVIMENTOS',
        'ROMANEIOSITENS_STATUS',
        'MOVIMENTOS_NUMERO', // INTEGER NOT NULL
        'MOVIMENTOS_SERIE',
        'MOVIMENTOS_EMISSAO',
        'MOVIMENTOS_NOME',
        'PESSOAS_INSCRICAO',
        'PESSOAS_CPFCNPJ',
        'PESSOAS_ENDERECO',
        'PESSOAS_NUMERO',
        'PESSOAS_BAIRRO',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'MOVIMENTOS_ID_PESSOAS',
        'MOVIMENTOS_ROMANEIOS', // Itens do pedido vinculado aos romaneios
        'MOVIMENTOS_OBSERVACOES',
        'MOVIMENTOS_ID_USUARIOS',
        'USUARIOS_NOME',
        {
            name: 'ROMANEIOSITENS_ID_ITEM',      // INTEGER NOT NULL
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSITENS_ID_PRODUTOS',
        'MOVIMENTOSITENS_ID',
        'PRODUTOS_NOME',
        'PRODUTOS_MARCA',
        'PRODUTOS_APLICACAO',
        {
            name: 'ROMANEIOSITENS_QUANTIDADE',       // NUMERIC(12,2)
            validators: [
                {type: 'range', min: 0.001, allowBlank: false}
            ]
        },
        'ROMANEIOSITENS_TOTAL',               // NUMERIC(12,2)
        'MOVIMENTOSITENS_QUANTIDADE',         // NUMERIC(12,2)
        'MOVIMENTOSITENS_IMEDIATA',           // NUMERIC(12,2)
        'MOVIMENTOSITENS_ENTREGUE',           // NUMERIC(12,2)
        'MOVIMENTOSITENS_DEPOSITO',           // NUMERIC(12,2)
        'MOVIMENTOSITENS_EMROMANEIO',         // NUMERIC(12,2)
        'MOVIMENTOSITENS_EMROMANEIOORIGINAL', // NUMERIC(12,2)
        'ITENS_SELECAO'
    ]
});
