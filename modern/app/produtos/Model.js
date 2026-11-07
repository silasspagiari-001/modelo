Ext.define('SamosAdminModern.produtos.Model', {
    extend: 'Ext.data.NodeJSModel',

    fields: [
        'CODIGO',
        'DESCRICAO',
        'UNIDADE',
        'BARRAS',
        'PRECO',
        'PRAZO',
        'DISPONIVEL',
        'STATUS',            
        'DEPOSITO',
        'SALDOS'
    ]
});
