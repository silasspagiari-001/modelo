Ext.define('SamosAdminModern.pessoas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PESSOAS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/pessoas'
    },

    constructor: function () {
        this.defaultValues = {
            'PESSOAS_ID_EMPRESAS': configs.getEmpresa().id,
            'PESSOAS_ID_PAISES'  : 31,
            'PESSOAS_TIPO'       : 'B',
            'PESSOAS_ID_USUARIOS': configs.getUsuario().id,
            'USUARIOS_NOME'      : configs.getUsuario().nome,
            'PESSOAS_INCLUSAO'   : SamosUtils.Info.getLog(),
            'PESSOAS_LOG'        : SamosUtils.Info.getLog(),
            'PESSOAS_CADASTRO'   : momentServer().format('YYYY-MM-DD'),
            'PESSOAS_VALIDADE'   : momentServer().subtract(1, 'year').format('YYYY-MM-DD'),
            'PESSOAS_NASCIMENTO' : '1899-12-30',
            'PESSOAS_CATEGORIA'  : '1',
            'PESSOAS_CREDITO'    : 0,
            'PESSOAS_FANTASIA'   : '',
            'PESSOAS_OBSERVACOES': '',
            'PESSOAS_PAGINA'     : '',
            'PESSOAS_INSCRICAO'  : '',
            'FOTO'               : location.href + 'resources/images/sem_foto.jpg'
        };

        this.callParent(arguments);
    },

    fields: [
        'PESSOAS_ID',
        {
            name: 'PESSOAS_STATUS',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PESSOAS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PESSOAS_FANTASIA',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PESSOAS_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'presence'},
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'PESSOAS_INSCRICAO',
            validators: [
                //{type: 'length', max:15}
                {
                    type: 'inscricaoestadual', 
                    module: 'PESSOAS', 
                    estadoField: 'CIDADES_ESTADO',
                    presence: false
                }
            ]
        },
        {
            name: 'PESSOAS_NASCIMENTO', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'PESSOAS_TIPO',
        'PESSOAS_CATEGORIA',  
        {
            name: 'PESSOAS_CADASTRO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_CEP',
            type: 'mask',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CIDADES_NOME',
            validators: [
                {type: 'presence'}
            ]
        }, 
        'CIDADES_ESTADO',
        'PESSOAS_ID_CIDADES',        
        'PESSOAS_ID_EMPRESAS',
        'CIDADES_IBGE',
        'PESSOAS_ID_PAISES',
        {
            name: 'PESSOAS_ENDERECO',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PESSOAS_NUMERO', 
            validators: [
                {type: 'presence'},
                {type: 'length', max: 10},
                {type: 'format', format: 'Número ou "S/NR"', matcher: /^[0-9]*$|S\/NR*$|s\/nr/}
            ]
        },
        {
            name: 'PESSOAS_BAIRRO',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PESSOAS_TELEFONE',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'PESSOAS_CELULAR'}
            ]
        },
        {
            name: 'PESSOAS_CELULAR',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'PESSOAS_TELEFONE'}
            ]
        },
        {
            name: 'PESSOAS_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        'PESSOAS_PAGINA',
        {
            name: 'PESSOAS_CEPCOBRANCA',
            type: 'mask',
            validators: [
                {type: 'presence'}
            ]
        },
        'PESSOAS_ID_CIDADESCOBRANCA',
        'CIDADES_NOMECOBRANCA', 
        'CIDADES_ESTADOCOBRANCA',
        'CIDADES_IBGECOBRANCA',
        {
            name: 'PESSOAS_ENDERECOCOBRANCA',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PESSOAS_NUMEROCOBRANCA', 
            validators: [
                {type: 'presence'},
                {type: 'length', max: 10},
                {type: 'format', format: 'Número ou "S/NR"', matcher: /^[0-9]*$|S\/NR*$|s\/nr/}
            ]
        },
        {
            name: 'PESSOAS_BAIRROCOBRANCA', 
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PESSOAS_TELEFONECOBRANCA', 
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'PESSOAS_CELULARCOBRANCA'}
            ]
        },
        {
            name: 'PESSOAS_CELULARCOBRANCA',
            type: 'mask',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_OBSERVACOES',
            validators: [
                {type: 'length', max: 2048}
            ]
        },
        'PESSOAS_CREDITO',
        {
            name: 'PESSOAS_VALIDADE',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'PESSOAS_INCLUSAO',
        'PESSOAS_LOG',
        'PESSOAS_ID_USUARIOS',
        'PESSOAS_FORMULA'
    ]
});
