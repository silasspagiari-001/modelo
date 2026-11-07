Ext.define('SamosAdmin.movimentos.telemarketing.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'TELEMARKETING_ID',

    proxy: {
        type: 'nodejsrest',
         url: 'server/telemarketing'
    },

    constructor: function () {
        this.defaultValues = {
            'TELEMARKETING_EMISSAO'    : momentServer().format('DD/MM/YYYY'),
            'TELEMARKETING_CEP'        : momentServer().format('HH:mm'),
            'TELEMARKETING_ID_USUARIOS': configs.getUsuario().id,
            'USUARIOS_LOGIN'           : configs.getUsuario().login,
            'TELEMARKETING_LOG'        : SamosUtils.Info.getLog()
        };

        this.callParent(arguments);
    },

    fields: [
        'TELEMARKETING_ID',
        {
            name: 'TELEMARKETING_STATUS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'TELEMARKETING_EMISSAO',
            type: 'nodejsdate',
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'TELEMARKETING_HORA',//VARCHAR(5)
            critical: true
        },
        {
            name: 'TELEMARKETING_PROXIMO',
            type: 'nodejsdate'
        },
        'TELEMARKETING_ID_USUARIOS',
        {
            name: 'TELEMARKETING_ID_PESSOAS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        'PESSOAS_NOME',
        {
            name: 'TELEMARKETING_NOME',
            critical: true,
            validators: [
                { type: 'presence' },
                { type: 'length', max: 50 }
            ]
        },
        {
            name: 'TELEMARKETING_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'presence'},
                {type: 'cpfcnpj'}
            ]
        },
        'TELEMARKETING_INSCRICAO',
        'TELEMARKETING_CEP',
        {
            name: 'TELEMARKETING_ENDERECO',
            validators: [
                { type: 'presence' },
                { type: 'length', max: 50 }
            ]
        },
        {
            name: 'TELEMARKETING_NUMERO', 
            validators: [
                { type: 'length', max: 10 }
            ]
        },
        {
            name: 'TELEMARKETING_BAIRRO',
            validators: [
                { type: 'presence' },
                { type: 'length', max: 50 }
            ]
        },
        'TELEMARKETING_ID_CIDADES',
        {
            name: 'TELEMARKETING_TELEFONE',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'TELEMARKETING_CELULAR'}
            ]
        },
        {
            name: 'TELEMARKETING_CELULAR',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'TELEMARKETING_TELEFONE'}
            ]
        },
        'TELEMARKETING_LOG',
        'TELEMARKETING_LANCAMENTOS'
    ]
});
