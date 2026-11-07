Ext.define('SamosAdmin.movimentos.ordenseleve.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordenseleve',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'ORDENS_STATUS'          : 'N',
            'TIPO_OS'                : 'N',
            'VEICULO_MARCA'          : '',
            'VEICULO_MODELO'         : '',
            'VEICULO_ANOMODELO'      : '',            
            'VEICULO_COMBUSTIVEL'    : 'N',
            'VEICULO_PRISMA'         : '',
            'VEICULO_PLACA'          : '',
            'VEICULO_KMINICIO'       : '',
            'VEICULO_KMFINAL'        : '',
            'ORDENS_ID_PRAZOS'       : '1',
            'ORDENS_ID_USUARIOS'     : configs.getUsuario().id,
            'USUARIOS_NOME'          : configs.getUsuario().nome,
            'USUARIOS_LOGIN'         : configs.getUsuario().login,
            'ORDENS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
            'ORDENS_REABERTURA'      : momentServer().format('YYYY-MM-DD'),
            'ORDENS_LOG'             : SamosUtils.Info.getLog(),
            'ORDENS_IMPORTADA'       : SamosUtils.Info.getLog(),
            'ORDENS_OBSERVACOES'     : '',
            'ORDENS_PRODUTOS'        : 0,
            'ORDENS_SERVICOS'        : 0,
            'ORDENS_DESCONTOS'       : 0,
            'ORDENS_TOTAL'           : 0,
            'ORDENS_ID_EMPRESAORIGEM': 0,
            'ORDENS_NUMEROORIGEM'    : 0,
            'ORDENS_SERIEORIGEM'     : ''
        };

        this.callParent(arguments);
    },

    fields: [
        'ORDENS_ID',
        'ORDENS_ID_EMPRESAS',
        {
            name: 'ORDENS_NUMERO',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_SERIE',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_STATUS',
        'ORDENS_ID_DOCUMENTOS',
        'ORDENS_ID_OPERACOES',
        'ORDENS_ID_PRAZOS',
        'ORDENS_ID_PESSOAS',
        {
            name: 'ORDENS_NOME', 
            critical: true,            
            validators: [
                {type: 'length', max: 50},
                {type: 'presence'}
            ]
        },
        'ORDENS_CPFCNPJ',        
        'ORDENS_ID_USUARIOS',
        'ORDENS_TELEFONE',        
        {
            name: 'ORDENS_CELULAR', 
            type: 'mask'
        },
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
            critical: true,
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_HORAEMISSAO',
        'ORDENS_HORAFECHAMENTO',
        'ORDENS_LOG',
        'ORDENS_ID_EMPRESAORIGEM',
        'ORDENS_NUMEROORIGEM',
        'ORDENS_SERIEORIGEM',
        'ORDENS_IMPORTADA',
        {
            name: 'ORDENS_REFERENCIA', 
            validators: [
                {type: 'length', max: 100}
            ]
        },
        {
            name: 'ORDENS_OBSERVACOES', 
            validators: [
                {type: 'length', max: 512}
            ]
        },
        {
            name: 'TIPO_OS',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_PERIODO',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'SERVICO_COMPRIMENTO',
            critical: true
        },
        {
            name: 'SERVICO_LARGURA',
            critical: true
        },
        {
            name: 'SERVICO_ALTURA',
            critical: true
        },
        {
            name: 'SERVICO_PESO',
            critical: true
        },
        {
            name: 'ALMOCO_INICIO',
            critical: true
        },
        {
            name: 'ALMOCO_FIM',
            critical: true
        },
        {
            name: 'JANTAR_INICIO',
            critical: true
        },
        {
            name: 'JANTAR_FIM',
            critical: true
        },
        'MECANICOS_NOME',
        {
            name: 'ORDENS_PRODUTOS',
            critical: true
        },
        {
            name: 'ORDENS_SERVICOS',
            critical: true
        },
        {
            name: 'ORDENS_DESCONTOS',
            critical: true
        },
        'ORDENS_TOTAL',
        'ORDENS_PRODUTOSITENS',  //lista de produtos
        'ORDENS_SERVICOSITENS'   //lista de servicos
    ]
});
