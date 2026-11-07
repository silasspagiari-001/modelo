Ext.define('SamosAdmin.atualizacao.portadores.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PORTADORES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/portadores'
    },

    constructor: function () {
        this.defaultValues = {
            'PORTADORES_ID_EMPRESAS': configs.getEmpresa().id,   
            'PORTADORES_CADASTRO'   : momentServer().format('YYYY-MM-DD'),
            'PORTADORES_REMESSA'    : 0,
            'PORTADORES_MORA'       : 0,
            'PORTADORES_MULTA'      : 0
        };
        this.callParent(arguments);
    },

    fields: [
        'PORTADORES_ID',                      //INTEGER NOT NULL
        {
            name: 'PORTADORES_ID_EMPRESAS',   //INTEGER NOT NULL
            validators: [
                {type: 'presence'}
            ]
        },
        'EMPRESAS_NOME',
        {
            name: 'PORTADORES_STATUS',      //CHAR(1) NOT NULL
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PORTADORES_CPFCNPJ',     //VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'},
                {type: 'presence'}
            ]
        },
        {
            name: 'PORTADORES_EMAIL',       //VARCHAR(50)
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PORTADORES_CADASTRO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PORTADORES_NOME',        //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PORTADORES_TELEFONE',    //VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PORTADORES_CEP',         //VARCHAR(8)
            type: 'mask',
            validators: [
                {type: 'presence'},
            ]
        },
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'CIDADES_IBGE',
        {
            name: 'PORTADORES_ENDERECO',    //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PORTADORES_NUMERO',      //VARCHAR(10)
            validators: [
                {type: 'length', max: 10},
                {type: 'format', format: 'Número ou "S/NR"', matcher: /^[0-9]*$|S\/NR/}
            ]
        },
        {
            name: 'PORTADORES_BAIRRO',      //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PORTADORES_ID_BANCOS',   //INTEGER NOT NULL
            validators: [
                {type: 'presence'}
            ]
        },
        'BANCOS_NOME',
        {
            name: 'PORTADORES_AGENCIA',     //VARCHAR(6)
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PORTADORES_CONTA',       //VARCHAR(15)
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PORTADORES_CONVENIO',    //VARCHAR(15)
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PORTADORES_CARTEIRA',    //VARCHAR(2)
            validators: [
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'PORTADORES_PROTESTO',    //VARCHAR(2)
            validators: [
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'PORTADORES_DEVOLUCAO',   //VARCHAR(2)
            validators: [
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'PORTADORES_REMESSA',     //INTEGER
            validators: [
                {type: 'presence'},
                {type: 'range', min: 0, max: 9999999}
            ]
        },
        {
            name: 'PORTADORES_MORA',        //NUMERIC(5,2)
            validators: [
                {type: 'presence'},
                {type: 'range', min: 0, max: 100}
            ]
        },
        {
            name: 'PORTADORES_MULTA',        
            validators: [
                {type: 'presence'},
                {type: 'range', min: 0, max: 100}
            ]
        },
        {
            name: 'PORTADORES_NOSSONUMERO',        
            validators: [
                {type: 'presence'}
            ]
        },
        'PORTADORES_ID_CIDADES',            //INTEGER NOT NULL
        'PORTADORES_LAYOUT',
        'PORTADORES_BOLETO',
        'PORTADORES_CEDENTE',
        'PORTADORES_CLIENTID',
        'PORTADORES_CLIENTSECRET',
        'PORTADORES_KEYUSER',
        'PORTADORES_SCOPE'
    ]
});
