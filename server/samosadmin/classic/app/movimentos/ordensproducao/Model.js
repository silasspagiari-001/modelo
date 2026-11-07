Ext.define('SamosAdmin.movimentos.ordensproducao.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRODUCOES_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordensproducao',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'PRODUCOES_STATUS'      : 'A',
            'PRODUCOES_ID_EMPRESAS' : configs.getEmpresa().id,
            'PRODUCOES_ID_USUARIOS' : configs.getUsuario().id,
            'USUARIOS_LOGIN'        : configs.getUsuario().login,
            'PRODUCOES_QUANTIDADE'  : 1,
            'VALOR_TOTAL'           : 0,
            'PRODUCOES_ID_LOTES'    : 0,
            'PRODUCOES_INCLUSAO'    : momentServer().format('YYYY-MM-DD'),
            'PRODUCOES_HORAINCLUSAO': momentServer().format('HH:mm:ss'),
            'PRODUCOES_INICIO'      : momentServer().format('YYYY-MM-DD'),
            'PRODUCOES_HORAINICIO'  : momentServer().format('HH:mm:ss'),
            'PRODUCOES_FINALIZADA'  : '1899-12-30',
            'PRODUCOES_LOG'         : SamosUtils.Info.getLog()
        };
        
        this.callParent(arguments);
    },
    
    fields: [
        'PRODUCOES_ID',
        'PRODUCOES_STATUS',
        'PRODUCOES_ID_EMPRESAS',
        'PRODUCOES_ID_PESSOAS',
        'PRODUCOES_ID_USUARIOS',
        {
            name: 'USUARIOS_LOGIN', 
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUCOES_ID_DOCUMENTOS',
        'PRODUCOES_ID_OPERACOES_S',
        'PRODUCOES_ID_OPERACOES_E',
        'PRODUCOES_ID_PRODUTOS',
        'PRODUCOES_ID_LOTES',
        {
            name: 'LOTES_ID',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUCOES_QUANTIDADE',
        'PRODUCOES_NUMERO',
        'PRODUCOES_SERIE',
        {
            name: 'PRODUCOES_INCLUSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUCOES_HORAINCLUSAO',
        {
            name: 'PRODUCOES_INICIO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUCOES_HORAINICIO',
        {
            name: 'PRODUCOES_FINALIZADA',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'PRODUCOES_HORAFINALIZADA',
        'PRODUCOES_ID_EMPRESAORIGEM',
        'PRODUCOES_NUMEROORIGEM',
        'PRODUCOES_SERIEORIGEM',
        'PRODUCOES_LOG',
        'PRODUCOES_ITENS'//lista de produtos
    ]
});
