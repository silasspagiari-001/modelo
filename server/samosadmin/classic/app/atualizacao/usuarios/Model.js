Ext.define('SamosAdmin.atualizacao.usuarios.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'USUARIOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/usuarios'
    },

    constructor: function () {
        this.defaultValues = {
            'USUARIOS_ID_EMPRESAS'        : configs.getEmpresa().id,
            'USUARIOS_TIPO'               : '2',
            'USUARIOS_TEMPO'              : '5',
            'USUARIOS_STATUS'             : 'T',
            'USUARIOS_PRIVILEGIADO'       : '1',
            'USUARIOS_LOGIN'              : '',
            'USUARIOS_VALIDADE'           : momentServer().add(90, 'days').format('YYYY-MM-DD'),
            'USUARIOS_CADASTRO'           : momentServer().format('YYYY-MM-DD'),
            'FOTO'                        : location.href + 'resources/images/sem_foto.jpg',
            'EXPEDIENTEINICIAL_USUARIOS'  : '08:00',
            'EXPEDIENTEFINAL_USUARIOS'    : '18:00',
            'INTERVALOINICIAL_USUARIOS'   : '00:00',
            'INTERVALOFINAL_USUARIOS'     : '00:00',
            'INTERVALOSABINICIAL_USUARIOS': '00:00',
            'INTERVALOSABFINAL_USUARIOS'  : '00:00',
            'DIASATIVODOM_USUARIOS'       : 'F',
            'DIASATIVOSEG_USUARIOS'       : 'T',
            'DIASATIVOTER_USUARIOS'       : 'T',
            'DIASATIVOQUA_USUARIOS'       : 'T',
            'DIASATIVOQUI_USUARIOS'       : 'T',
            'DIASATIVOSEX_USUARIOS'       : 'T',
            'DIASATIVOSAB_USUARIOS'       : 'T',
            'USUARIOS_ULTIMOLOG'          : '1899-12-30'
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
        {
            name: 'EXPEDIENTEINICIAL_USUARIOS',
            critical: true
        },
        {
            name: 'EXPEDIENTEFINAL_USUARIOS',
            critical: true
        },
        {
            name: 'INTERVALOINICIAL_USUARIOS',
            critical: true
        },
        {
            name: 'INTERVALOFINAL_USUARIOS',
            critical: true
        },
        {
            name: 'INTERVALOSABINICIAL_USUARIOS',
            critical: true
        },
        {
            name: 'INTERVALOSABFINAL_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVODOM_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVOSEG_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVOTER_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVOQUA_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVOQUI_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVOSEX_USUARIOS',
            critical: true
        },
        {
            name: 'DIASATIVOSAB_USUARIOS',
            critical: true
        },
        'USUARIOS_ULTIMOLOG'
    ]
});
