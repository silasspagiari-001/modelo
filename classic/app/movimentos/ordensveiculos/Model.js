Ext.define('SamosAdmin.movimentos.ordensveiculos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordensveiculos',
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
            'ORDENS_LOG'             : SamosUtils.Info.getLog(),
            'ORDENS_OBSERVACOES'     : configs.getClientName() == 'masterautocenter' ? '' :  '||||||||||',
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
        'ORDENS_HORAFECHAMENTO',
        'ORDENS_LOG',
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
            name: 'VEICULO_PRISMA',
            critical: true
        },
        {
            name: 'VEICULO_PLACA',
            critical: true
        },
        {
            name: 'VEICULO_MARCA',
            critical: true
        },
        {
            name: 'VEICULO_MODELO',
            critical: true
        },
        {
            name: 'VEICULO_ANOMODELO',
            critical: true
        },
        {
            name: 'VEICULO_KMINICIO',
            critical: true
        },
        {
            name: 'VEICULO_KMFINAL',
            critical: true
        },
        {
            name: 'VEICULO_COMBUSTIVEL',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'OBSERVACOES_EMPRESA',
            critical: true
        },
        {
            name: 'OBSERVACOES_CLIENTE',
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
