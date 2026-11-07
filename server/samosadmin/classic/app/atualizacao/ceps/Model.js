Ext.define('SamosAdmin.atualizacao.ceps.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CEPS_CEP',

    fields: [
        'CEPS_CEP',
        'CEPS_ENDERECO',
        'CEPS_BAIRRO',
        'CEPS_CIDADE',
        'CEPS_ESTADO',
        'CEPS_IBGE'
    ]
});
