Ext.define('SamosAdmin.atualizacao.pessoas.form.formulafornecedor.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PESSOAS_ID',

    fields: [
        'FORMULA_CODIGO',
        'FORMULA_DESCONTO',
        'FORMULA_IPI',
        'FORMULA_SEGURO',
        'FORMULA_PRAZO',
        'FORMULA_FRETE',
        'FORMULA_DESPESAS'
    ]
});

