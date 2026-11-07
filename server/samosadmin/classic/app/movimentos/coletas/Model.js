Ext.define('SamosAdmin.movimentos.coletas.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'COLETAS_ID',

    proxy: {
        type: 'nodejsrest',
         url: 'server/coletas'
    },

    constructor: function () {
        this.defaultValues = {
            'COLETAS_ID_EMPRESAS'  : configs.getEmpresa().id,
            'COLETAS_ID_USUARIOS'  : 0,
            'COLETAS_ID_PESSOAS'   : 0,
            'COLETAS_ID_FORNECEDOR': 0,
            'COLETAS_EMISSAO'      : momentServer().format('DD/MM/YYYY'),
            'COLETAS_AGENDA'       : '1899-12-30',
            'COLETAS_SAIDA'        : '1899-12-30',            
            'COLETAS_HORAEMISSAO'  : momentServer().format('HH:mm'),
            'COLETAS_ID_USUARIOS'  : configs.getUsuario().id,
            'USUARIOS_LOGIN'       : configs.getUsuario().login,
            'COLETAS_STATUS'       : 'A',
            'COLETAS_LOG'          : SamosUtils.Info.getLog()
        };

        this.callParent(arguments);
    },

    fields: [
        'COLETAS_ID',
        'COLETAS_ID_DOCUMENTOS',
        {
            name: 'COLETAS_NUMERO',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'COLETAS_SERIE',
            critical: true,
            validators: [
                {type: 'presence'},
                {type: 'length', max: 3}
            ]
        },   
        {
            name: 'COLETAS_STATUS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'COLETAS_EMISSAO',
            type: 'nodejsdate',
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'COLETAS_HORAEMISSAO',
            critical: true
        },
        {
            name: 'COLETAS_SAIDA',
            type: 'nodejsdate'
        },
        {
            name: 'COLETAS_HORASAIDA',
        },
        {
            name: 'COLETAS_AGENDA',
            type: 'nodejsdate'            
        },
        {
            name: 'COLETAS_ID_PESSOAS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'CLIENTE_NOME',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'FORNECEDOR_NOME',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'COLETAS_ID_USUARIOS',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'COLETAS_ID_FORNECEDOR',
            critical: true,
            validators: [
                { type: 'presence' }
            ]
        },
        {
            name: 'COLETAS_TOTAL'           // NUMERIC(12,2)
        },
        'COLETAS_LOG',
        'COLETAS_OBSERVACOES'
    ]
});
