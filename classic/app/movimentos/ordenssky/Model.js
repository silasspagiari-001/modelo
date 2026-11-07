Ext.define('SamosAdmin.movimentos.ordenssky.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ORDENS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/ordenssky/ordem',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ORDENS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'ORDENS_STATUS'          : '2',
            'ORDENS_AGENDAMENTO'     : 'F',
            'ORDENS_ID_PRAZOS'       : '1',
            'ORDENS_ID_USUARIOS'     : '',
            'USUARIOS_NOME'          : '',
            'ORDENS_ID_TECNICO'      : '0',
            'TECNICO_NOME'           : '',
            'ORDENS_HORAEMISSAO'     : momentServer().format('HH:mm'),
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
        'ORDENS_AGENDAMENTO',
        'ORDENS_IMPORTADA',
        {
            name: 'ORDENS_PLANO', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
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
        {
            name: 'ORDENS_IDENTIFICACAO',
            type: 'mask',
            validators: [
                {type: 'length', max: 15},
            ]
        },
        'ORDENS_TELEFONE',
        {
            name: 'ORDENS_CELULAR',
            type: 'mask',
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_ID_USUARIOS',
        {
            name: 'USUARIOS_NOME', 
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_ID_TECNICO',
        'TECNICO_NOME',
        'ORDENS_EMAIL',
        {
            name: 'ORDENS_CONTATOS', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENS_EMISSAO',
            critical: true,
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORDENS_HORAEMISSAO', 
            critical: true
        },
        {
            name: 'ORDENS_REABERTURA',
            type: 'nodejsdate'
        },
        'ORDENS_HORAREABERTURA',
        'ORDENS_LOG',
        {
            name: 'ORDENS_PERIODO', 
            validators: [
                {type: 'presence'}
            ]
        },
        'ORDENS_CEP',
        {
            name: 'ORDENS_CEP', 
            validators: [
                {type: 'length', max: 8}
            ]
        },
        'ORDENS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        {
            name: 'ORDENS_ENDERECO', 
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'ORDENS_NUMEROLC', 
            validators: [
                {type: 'length', max: 10}
            ]
        },
        {
            name: 'ORDENS_BAIRRO', 
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
        {
            name: 'ORDENS_TEMPO', 
            validators: [
                {type: 'length', max: 10}
            ]
        },
        'ORDENS_GEOLOCALIZACAO',
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
