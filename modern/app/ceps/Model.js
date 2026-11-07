Ext.define('SamosAdminModern.ceps.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CEPS_ID',

    fields: [
        'CEPS_ID',
        'CEPS_CEP',
        'CEPS_ENDERECO',
        'CEPS_BAIRRO',
        'CEPS_CIDADE',
        'CEPS_ESTADO',
        'CEPS_IBGE',
        'CEPS_LATITUDE',
        'CEPS_LONGITUDE'
    ]
});
