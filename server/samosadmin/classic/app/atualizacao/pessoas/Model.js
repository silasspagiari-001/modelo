Ext.define('SamosAdmin.atualizacao.pessoas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PESSOAS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/pessoas'
    },

    constructor: function () {
        this.defaultValues = {
            'PESSOAS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'PESSOAS_ID_PAISES'       : 31,
            'PESSOAS_TIPO'            : configs.getPessoas().tipos.find(list => list[1] == 'Clientes')[0],
            'PESSOAS_ID_USUARIOS'     : configs.getUsuario().id,
            'USUARIOS_NOME'           : configs.getUsuario().nome,
            'PESSOAS_INCLUSAO'        : SamosUtils.Info.getLog(),
            'PESSOAS_LOG'             : SamosUtils.Info.getLog(),
            'PESSOAS_CADASTRO'        : momentServer().format('YYYY-MM-DD'),
            'PESSOAS_VALIDADE'        : momentServer().subtract(1, 'year').format('YYYY-MM-DD'),
            'PESSOAS_NASCIMENTO'      : '1899-12-30',
            'PESSOAS_CATEGORIA'       : (configs.getClientName().match(/biomart|organoplant/) ? '0' : '1'),
            'PESSOAS_CREDITO'         : 0,
            'PESSOAS_RETENCAO'        : 0,
            'PESSOAS_DESCONTO'        : 0,
            'PESSOAS_FANTASIA'        : '',
            'PESSOAS_OBSERVACOES'     : '',
            'PESSOAS_PAGINA'          : '',
            'PESSOAS_EMAIL'           : '',
            'PESSOAS_TELEFONE'        : '',
            'PESSOAS_CELULAR'         : '',
            'PESSOAS_TELEFONECOBRANCA': configs.getPessoas().usarCampoRG ? '' : 'Cobranca',
            'PESSOAS_INSCRICAO'       : '',
            'PESSOAS_SUFRAMA'         : '',
            'REGISTRO_GERAL'          : '',  // RG
            'FOTO'                    : location.href + 'resources/images/sem_foto.jpg',
            'XML_AUTOMATICO'          : 'F',
            'PARTIDA_NFE'             : 'F',
            'CLASSE_CADASTRO'         : 'A'
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
                {
                    type: 'inscricaoestadual', 
                    module: 'PESSOAS', 
                    estadoField: 'CIDADES_ESTADO',
                    presence: false
                }
            ]
        },
        {
            name: 'PESSOAS_SUFRAMA',
            validators: [
                {type: 'length', max: 15}
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
                {type: 'length', max: 10}
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
                {type: 'presence'},
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
//              {type: 'format', format: 'Número ou "S/NR"', matcher: /^[0-9]*$|S\/NR*$|s\/nr/}
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
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_CELULARCOBRANCA',
            type: 'mask',
            validators: [
                {type: 'presence', alternative: 'PESSOAS_TELEFONECOBRANCA'}
            ]
        },
        {
            name: 'PESSOAS_OBSERVACOES',
            critical: true,
            validators: [
                {type: 'length', max: 512}
            ]
        },
        'PESSOAS_CREDITO',
        'PESSOAS_RETENCAO',
        'PESSOAS_DESCONTO',
        {
            name: 'PESSOAS_VALIDADE',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_INCLUSAO',
            critical: true
        },
        'PESSOAS_LOG',
        'PESSOAS_ID_USUARIOS',
        {
            name: 'REGISTRO_GERAL',
            critical: true
        },
        {
            name: 'PESSOAS_FORMULA',
            critical: true
        },
        {
            name: 'XML_AUTOMATICO',
            critical: true
        },
        {
            name: 'PARTIDA_NFE',
            critical: true
        },
        {
            name: 'CLASSE_CADASTRO',
            critical: true
        },
        {
            name: 'VCTO_FIXO',
            critical: true
        }
    ]
});
