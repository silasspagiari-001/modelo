Ext.define('SamosAdmin.atualizacao.transportes.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'TRANSPORTES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/transportes'
    },

   constructor: function () {
        this.defaultValues = {
           'TRANSPORTES_VIA'     : 'R',
           'TRANSPORTES_MODO'    : 'F',
           'TRANSPORTES_CADASTRO': momentServer().format('YYYY-MM-DD')
       };
       this.callParent(arguments);
    },

    fields: [
        'TRANSPORTES_ID',
        {
            name: 'TRANSPORTES_STATUS',       ///  CHAR(1) NOT NULL
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'TRANSPORTES_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'TRANSPORTES_CPFCNPJ',      ///  VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'TRANSPORTES_INSCRICAO'
        },
        {
            name: 'TRANSPORTES_TELEFONE',
            type: 'mask',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'TRANSPORTES_CELULAR',
            type: 'mask',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'TRANSPORTES_CADASTRO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'TRANSPORTES_CEP',
            type: 'mask'
        },
        'CIDADES_NOME',
        {
            name: 'TRANSPORTES_BAIRRO',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        'CIDADES_ESTADO',
        {
            name: 'TRANSPORTES_ENDERECO',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'TRANSPORTES_NUMERO',
            validators: [
                {type: 'length', max: 10},
                {type: 'format', format: 'Número ou "S/NR"', matcher: /^[0-9]*$|S\/NR/}
            ]
        },
        'CIDADES_IBGE',
        {
            name: 'TRANSPORTES_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'TRANSPORTES_PAGINA',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        'TRANSPORTES_VIA', // Rodoviario,Ferroviario,Fluival,Aereo
        'TRANSPORTES_MODO', // Fob,Cif
        'TRANSPORTES_ID_CIDADES', //  INTEGER NOT NULL
    ]
});
