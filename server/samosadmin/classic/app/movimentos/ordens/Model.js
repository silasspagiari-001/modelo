Ext.define('SamosAdmin.movimentos.ordens.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordens',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENS_ID_EMPRESAORIGEM': 0,
            'ORDENS_NUMEROORIGEM'    : 0,
            'ORDENS_SERIEORIGEM'     : '',
            'ORDENS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'USUARIOS_NOME'          : configs.getUsuario().nome,
            'ORDENS_ID_USUARIOS'     : configs.getUsuario().id,
            'ORDENS_STATUS'          : 'N',
            'ORDENS_REFERENCIA'      : '******',
            'ORDENS_IDSKY'           : 0,
            'ORDENS_ID_PRAZOS'       : '1',
            'ORDENS_ID_USUARIOS'     : configs.getUsuario().id,
            'USUARIOS_LOGIN'         : configs.getUsuario().login,
            'ORDENS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
            'ORDENS_FECHAMENTO'      : '1899-12-30',
            'ORDENS_HORAFECHAMENTO'  : '',
            'ORDENS_REABERTURA'      : '1899-12-30',
            'ORDENS_ID_ORDENSROTAS'  : 0,
            'ORDENS_LOG'             : SamosUtils.Info.getLog(),
            'ORDENS_OBSERVACOES'     : '||||||||||',
            'ORDENS_PRODUTOS'        : 0,
            'ORDENS_SERVICOS'        : 0,
            'ORDENS_DESCONTOS'       : 0,
            'ORDENS_TOTAL'           : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENS_ID',
        'ORDENS_ID_EMPRESAS',
        'ORDENS_NUMERO',
        'ORDENS_SERIE',
        'ORDENS_STATUS',
        'ORDENS_ID_DOCUMENTOS',
        'DOCUMENTOS_ALTERAPRECO',
        'ORDENS_ID_OPERACOES',
        'ORDENS_ID_PRAZOS',
        'PRAZOS_NOME',
        'PRAZOS_PARCELAMENTO',
        'PRAZOS_PARCELAS',
        'ORDENS_ID_PESSOAS',
        {
            name: 'ORDENS_NOME', 
            validators: [
                {type: 'length', max: 50},
                {type: 'presence'}
            ]
        },
        'ORDENS_CPFCNPJ',
        {
            name: 'PESSOAS_TELEFONE',
            type: 'mask'
        },
        {
            name: 'PESSOAS_CELULAR',
            type: 'mask'
        },
        'ORDENS_ID_USUARIOS',
        'USUARIOS_NOME',
        {
            name: 'USUARIOS_LOGIN', 
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_EMAIL',
        {
            name: 'ORDENS_EMISSAO',
            critical: true,
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_REABERTURA',
            type: 'nodejsdate'
        },
        'ORDENS_LOG',
        'PESSOAS_CEP',
        'PESSOAS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        {
            name: 'PESSOAS_ENDERECO', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        'PESSOAS_NUMERO',
        {
            name: 'PESSOAS_BAIRRO', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENS_REFERENCIA', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        'ORDENS_ID_EMPRESAORIGEM',
        'ORDENS_NUMEROORIGEM',
        'ORDENS_SERIEORIGEM',
        {
            name: 'ORDENS_OBSERVACOES', 
            validators: [
                {type: 'length', max: 512}
            ]
        },
        'ORDENS_PRODUTOS',
        'ORDENS_SERVICOS',
        'ORDENS_DESCONTOS',
        'ORDENS_TOTAL',
        'ORDENS_ATIVOS',    //lista de equipamentos ativos
        'ORDENS_AVARIADOS', //lista de equipamentos avariados
        'ORDENS_PRODUTOSITENS',  //lista de produtos
        'ORDENS_SERVICOSITENS'   //lista de servicos
    ]
});
