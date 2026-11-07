Ext.define('SamosAdmin.movimentos.movimento.form.pessoa.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PESSOAS_ID',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'PESSOAS_ID': -1,
            'PESSOAS_ID_CIDADES': configs.getPermissao()['EMPRESAS_ID_CIDADES'],
            'PESSOAS_ID_EMPRESAS': configs.getEmpresa().id,
            'PESSOAS_ID_PAISES'  : 31,
            'PESSOAS_TIPO'       : configs.getPessoas().tipos.find(list => list[1] == 'Clientes')[0],
            'PESSOAS_ID_USUARIOS': configs.getUsuario().id,
            'USUARIOS_NOME'      : configs.getUsuario().nome,
            'PESSOAS_INCLUSAO'   : SamosUtils.Info.getLog(),
            'PESSOAS_LOG'        : SamosUtils.Info.getLog(),
            'PESSOAS_CADASTRO'   : momentServer().format('YYYY-MM-DD'),
            'PESSOAS_VALIDADE'   : momentServer().format('YYYY-MM-DD'),
            'PESSOAS_NASCIMENTO' : '1899-12-30',
            'PESSOAS_CATEGORIA'  : '1',
            'PESSOAS_CREDITO'    : 0,
            'PESSOAS_FANTASIA'   : '',
            'PESSOAS_OBSERVACOES': '',
            'PESSOAS_PAGINA'     : '',
            'PESSOAS_INSCRICAO'  : '',
        };

        this.callParent(arguments);
    },

    fields: [
        'PESSOAS_ID',
        { name: 'PESSOAS_CPFCNPJ',   validators: [ {type: 'presence'} ] },
        'PESSOAS_INSCRICAO',  // IE 
        'REGISTRO_GERAL',     // RG
        {
            name: 'PESSOAS_NASCIMENTO', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_VALIDADE', 
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
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
                {type: 'length', max: 50}
            ]
        },
        'PESSOAS_PAGINA'
    ]
});
