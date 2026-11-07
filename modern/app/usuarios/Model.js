Ext.define('SamosAdminModern.usuarios.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'USUARIOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/usuarios'
    },

    constructor: function () {
        this.defaultValues = {
            'USUARIOS_ID_EMPRESAS' : configs.getEmpresa().id,
            'USUARIOS_TIPO'        : '2',
            'USUARIOS_TEMPO'       : '5',
            'USUARIOS_STATUS'      : 'T',
            'USUARIOS_PRIVILEGIADO': '1',
            'USUARIOS_LOGIN'       : '',
            'USUARIOS_VALIDADE'    : momentServer().add(90, 'days').format('YYYY-MM-DD'),
            'USUARIOS_CADASTRO'    : momentServer().format('YYYY-MM-DD'),
            'FOTO'                 : location.href + 'resources/images/sem_foto.jpg'
        };
        this.callParent(arguments);
    },

    fields: [
        'USUARIOS_ID',
        'USUARIOS_STATUS',
        {
            name: 'USUARIOS_NOME', //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        'EMPRESAS_NOME', //VARCHAR(50)
        {
            name:'USUARIOS_LOGIN',       //VARCHAR(50) NOT NULL
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'USUARIOS_CPFCNPJ',      ///  VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'presence', max:15},
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'USUARIOS_RG', //VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'presence', max:15}
            ]
        },
        'USUARIOS_TIPO',
        'USUARIOS_TEMPO',
        {
            name: 'USUARIOS_TELEFONE', //VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'USUARIOS_CELULAR', //VARCHAR(15)
            type: 'mask',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'USUARIOS_VALIDADE',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'USUARIOS_CADASTRO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'USUARIOS_CEP', //VARCHAR(8)
            type: 'mask',
            validators: [
                {type: 'presence', max:9}
            ]
        },
        'USUARIOS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_IBGE',
        'CIDADES_ESTADO',
        {
            name: 'USUARIOS_ENDERECO', //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'USUARIOS_BAIRRO', //VARCHAR(50)
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        }, 
        {
            name: 'USUARIOS_EMAIL', //VARCHAR(50)
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'USUARIOS_COMISSAO',      //FLOAT
            type: 'float'
        },
        {
            name: 'USUARIOS_PRIVILEGIADO'
        },
        'USUARIOS_ID_EMPRESAS',
        {
            name: 'USUARIOS_NASCIMENTO',
            type: 'nodejsdate'
        },
        'USUARIOS_EXPEDIENTE',
        'USUARIOS_INTERVALO',
        'USUARIOS_SKYPE',
        'USUARIOS_DIASATIVO',
        'USUARIOS_ULTIMOLOG'
    ]
});
