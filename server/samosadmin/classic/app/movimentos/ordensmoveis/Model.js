Ext.define('SamosAdmin.movimentos.ordensmoveis.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordensmoveis',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'ORDENS_STATUS'          : 'N',
            'ORDENS_ID_PRAZOS'       : '1',
            'ORDENS_ID_USUARIOS'     : '',
            'ORDENS_ID_ORDENSROTAS'  : 0,
            'ORDENS_IDSKY'           : 0,
            'USUARIOS_LOGIN'         : configs.getUsuario().login,
            'ORDENS_HORAEMISSAO'     : momentServer().format('HH:mm:ss'),
            'ORDENS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
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
        'ORDENS_ID_OPERACOES',
        'ORDENS_ID_PRAZOS',
        'ORDENS_ID_ORDENSROTAS',
        'ORDENS_IDSKY',
        {
            name: 'EMPRESAS_CNAE',
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_ID_PESSOAS',
        {
            name: 'ORDENS_NOME', 
            validators: [
                {type: 'length', max: 50},
                {type: 'presence'}
            ]
        },
        'ORDENS_CPFCNPJ',        
        'ORDENS_ID_USUARIOS',
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
        'ORDENS_HORAEMISSAO',
        'ORDENS_LOG',
        {
            name: 'ORDENS_REFERENCIA', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
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
        'ORDENS_PRODUTOSITENS',  //lista de produtos
        'ORDENS_SERVICOSITENS'   //lista de servicos
    ]
});
