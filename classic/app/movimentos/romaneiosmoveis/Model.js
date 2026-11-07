Ext.define('SamosAdmin.movimentos.romaneiosmoveis.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'ROMANEIOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/romaneiosmoveis',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'ROMANEIOS_ID_EMPRESAS'   : configs.getEmpresa().id,
            'ROMANEIOS_ID_MOVIMENTOS' : 0,            
            'ROMANEIOS_ID_USUARIOS'   : configs.getUsuario().id,
            'ROMANEIOS_ID_TRANSPORTES': 1,
            'ROMANEIOS_LOCAL'         : 'U',
            'ROMANEIOS_PLACA'         : 'E',
            'USUARIOS_NOME'           : configs.getUsuario().nome,
            'ROMANEIOS_HORA'          : momentServer().format('HH:mm:ss'),
            'ROMANEIOS_EMISSAO'       : momentServer().format('YYYY-MM-DD'),
            'ROMANEIOS_STATUS'        : 'N',
            'ROMANEIOS_LOG'           : SamosUtils.Info.getLog(),
            'ROMANEIOS_CONTADOR'      : 0,
            'ROMANEIOS_FRETE'         : 0,
            'ROMANEIOS_SEGURO'        : 0,
            'ROMANEIOS_DESPESAS'      : 0,
            'ROMANEIOS_TOTAL'         : 0,
            'ROMANEIOS_OBSERVACOES'   : configs.getClientName() == 'stilomoveis' ? '' : '||||||||||'
        };

        this.callParent(arguments);
    },

    fields: [
        'ROMANEIOS_ID',
        {
            name: 'ROMANEIOS_NUMERO',
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        },
        'ROMANEIOS_SERIE',
        'ROMANEIOS_ID_MOVIMENTOS',  
        {
            name: 'ROMANEIOS_ID_DOCUMENTOS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        },
        'DOCUMENTOS_NOME',
        'DOCUMENTOS_LAYOUT',
        {
            name: 'ROMANEIOS_ID_EMPRESAS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        },
        'ROMANEIOS_ID_TRANSPORTES',
        {
            name: 'ROMANEIOS_ID_PESSOAS',      
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PESSOAS_NOME',
            validators: [
                {type: 'presence'}
            ]           
        },   
        'PESSOAS_ENDERECO',
        'PESSOAS_NUMERO',
        'PESSOAS_CPFCNPJ',
        'PESSOAS_TELEFONE',
        'PESSOAS_CELULAR',
        'PESSOAS_EMAIL',
        'PESSOAS_TIPO',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'CIDADES_IBGE',
        'PESSOAS_FORMULA',
        {
            name: 'ROMANEIOS_EMISSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'ROMANEIOS_HORA',             //VARCHAR(10)
        {
            name: 'ROMANEIOS_SAIDA',    // DATE
            type: 'nodejsdate'
        },
        'ROMANEIOS_PLACA',
        'ROMANEIOS_LOCAL',
        {
            name: 'ROMANEIOS_STATUS',         // CHAR(1),
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ROMANEIOS_ID_USUARIOS',    
            validators: [
                {type: 'presence'}
            ]
        },
        'USUARIOS_NOME',
        'ROMANEIOS_LOG',
        'ROMANEIOS_IMPRESSAO',
        'ROMANEIOS_CONTADOR',
        {
            name: 'ROMANEIOS_FRETE',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ROMANEIOS_SEGURO',          // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ROMANEIOS_DESPESAS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ROMANEIOS_TOTAL',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ROMANEIOS_OBSERVACOES',    // VARCHAR(512),
            validators: [
                {type: 'length', max: 512}
            ]
        },
        'ROMANEIOS_ITENS'  // lista de ModelItens
    ]
});
