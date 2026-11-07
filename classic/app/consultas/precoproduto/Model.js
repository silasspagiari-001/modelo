Ext.define('SamosAdmin.consultas.precoproduto.Model', {
    extend: 'Ext.data.NodeJSModel',
    fields: [
        'CODIGO',
        'GRUPO',
        'DESCRICAO',
        'UNIDADE',
        'BARRAS',
        'PRECO',
        'PRAZO',
        'DISPONIVEL',
        'STATUS',  
        'LOCAL',          
        'DEPOSITO',
        'SALDOS',
        'LOTES'
    ]
});
