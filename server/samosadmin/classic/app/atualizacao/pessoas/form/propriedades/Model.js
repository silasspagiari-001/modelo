Ext.define('SamosAdmin.atualizacao.pessoas.form.propriedades.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PROPRIEDADES_ID',

    proxy: {
        type: 'nodejsrest',
         url: 'server/propriedades'
    },

    constructor: function () {
        this.defaultValues = {
            'PROPRIEDADES_STATUS'     : 'T',
            'PROPRIEDADES_CADASTRO'   : momentServer().format('DD/MM/YYYY'),
            'USUARIOS_LOGIN'           : configs.getUsuario().login
        };

        this.callParent(arguments);
    },

    fields: [
        'PROPRIEDADES_ID',
        {
            name: 'PROPRIEDADES_STATUS',//  CHAR(1)
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PROPRIEDADES_CADASTRO',
            type: 'nodejsdate',
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'PROPRIEDADES_ID_PESSOAS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'PROPRIEDADES_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'presence'},
                {type: 'cpfcnpj'}
            ]
        },
        'PROPRIEDADES_INSCRICAO',
        {
            name: 'PROPRIEDADES_NOME',
            critical: true,
            validators: [
                { type: 'presence' },
                { type: 'length', max: 50 }
            ]
        },
        'PROPRIEDADES_ID_CIDADES',        
        'PROPRIEDADES_CEP',
        {
            name: 'PROPRIEDADES_ENDERECO',
            validators: [
                { type: 'presence' },
                { type: 'length', max: 50 }
            ]
        },
        {
            name: 'PROPRIEDADES_NUMERO', 
            validators: [
                { type: 'presence' },
                { type: 'length', max: 20 }
//                { type: 'format', format: 'Número ou "S/NR"', matcher: /^[0-9]*$|S\/NR*$|s\/nr/ }
            ]
        },
        {
            name: 'PROPRIEDADES_BAIRRO',
            validators: [
                { type: 'presence' },
                { type: 'length', max: 50 }
            ]
        },

        {
            name: 'PROPRIEDADES_TELEFONE',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'PROPRIEDADES_CELULAR'}
            ]
        },
        {
            name: 'PROPRIEDADES_CELULAR',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'PROPRIEDADES_TELEFONE'}
            ]
        },
        'PROPRIEDADES_OBSERVACOES'
    ]
});
