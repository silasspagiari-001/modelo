Ext.define('SamosAdmin.movimentos.manifestos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MANIFESTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/manifestos',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'MANIFESTOS_ID_EMPRESAS'   : configs.getEmpresa().id,
            'EMPRESAS_AMBIENTE'        : configs.getEmpresa().ambiente,
            'MANIFESTOS_HORA'          : momentServer().format('HH:mm:ss'),
            'MANIFESTOS_EMISSAO'       : momentServer().format('YYYY-MM-DD'),
            'MANIFESTOS_STATUS'        : 'N',
            'MANIFESTOS_LOG'           : SamosUtils.Info.getLog(),
            'MANIFESTOS_TIPOFRETE'     : 'D',
            'MANIFESTOS_TIPOVEICULO'   : 'T',
            'MANIFESTOS_PLACAUFVEICULO': configs.getPermissao()['CIDADES_ESTADO'],
            'MANIFESTOS_TIPOCARROCERIA': 'F',
            'MANIFESTOS_TIPOCARGA'     : 'E',
            'MANIFESTOS_TIPOEMITENTE'  : 'N',
            'MANIFESTOS_OBSERVACOES'   : '',
            'MANIFESTOS_ESTADOS'       : '',
            'MANIFESTOS_PLACAREBOQUEUF': '',
            'MANIFESTOS_SEGURADORA'    : (configs.getMovimentos().nomeSeguradora   || ''),
            'MANIFESTOS_CONTRATANTE'   : (configs.getMovimentos().cnpjSeguradora   || ''),         
            'MANIFESTOS_CPFCNPJ'       : (configs.getMovimentos().cnpjSeguradora   || ''),
            'MANIFESTOS_APOLICE'       : (configs.getMovimentos().numeroApolice    || ''), 
            'MANIFESTOS_AVERBACAO'     : (configs.getMovimentos().numeroAverbacao  || ''),                                 
            'MANIFESTOS_TARAVEICULO'   : 0,
            'MANIFESTOS_CARGAVEICULO'  : 0,
            'MANIFESTOS_TAMANHOVEICULO': 0,
            'MANIFESTOS_TARAREBOQUE'   : 0,
            'MANIFESTOS_CARGAREBOQUE'  : 0,
            'MANIFESTOS_TAMANHOREBOQUE': 0,
            'MANIFESTOS_BASEICMS'      : 0,
            'MANIFESTOS_VALORICMS'     : 0,
            'MANIFESTOS_BASESUBST'     : 0,
            'MANIFESTOS_VALORSUBST'    : 0,
            'MANIFESTOS_FRETE'         : 0,
            'MANIFESTOS_SEGURO'        : 0,
            'MANIFESTOS_SERVICOS'      : 0,
            'MANIFESTOS_IPI'           : 0,
            'MANIFESTOS_IBPT'          : 0,
            'MANIFESTOS_QUANTIDADENFE' : 0,
            'MANIFESTOS_QUANTIDADECFE' : 0,
            'MANIFESTOS_PESOLIQUIDO'   : 0,
            'MANIFESTOS_PESOBRUTO'     : 0,
            'MANIFESTOS_DESCONTOS'     : 0,
            'MANIFESTOS_PRODUTOS'      : 0,
            'MANIFESTOS_TOTAL'         : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'MANIFESTOS_ID',
        {
            name: 'MANIFESTOS_ID_EMPRESAS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        }, 
        'EMPRESAS_AMBIENTE',  
        {
            name: 'MANIFESTOS_ID_TRANSPORTES'
        },
        {
            name: 'MANIFESTOS_TRANSPNOME', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_TRANSPCPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'MANIFESTOS_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'MANIFESTOS_TIPOFRETE',   
            validators: [
                {type: 'presence'}
            ]
        }, 
        {
            name: 'MANIFESTOS_EMISSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        },
        'MANIFESTOS_HORA',
        {
            name: 'MANIFESTOS_ID_DOCUMENTOS',
            critical: true
        },
        {
            name: 'MANIFESTOS_NUMERO', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'MANIFESTOS_SERIE', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_TIPOVEICULO',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_TIPOCARROCERIA',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_TIPOCARGA',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_TIPOEMITENTE',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_PLACAVEICULO',      
            validators: [
                {type: 'presence'},
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MANIFESTOS_PLACAUFVEICULO',      
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2 }
            ]
        },
        {
            name: 'MANIFESTOS_PLACAREBOQUE',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MANIFESTOS_PLACAREBOQUEUF',      
            validators: [
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'MANIFESTOS_RENAVAN',      
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MANIFESTOS_RNTC',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MANIFESTOS_CIOT',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        'MANIFESTOS_LOG',
        {
            name: 'MANIFESTOS_STATUS',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'MANIFESTOS_TARAVEICULO',
        'MANIFESTOS_CARGAVEICULO',
        'MANIFESTOS_TAMANHOVEICULO',
        'MANIFESTOS_TARAREBOQUE',
        'MANIFESTOS_CARGAREBOQUE',
        'MANIFESTOS_TAMANHOREBOQUE',
        {
            name: 'MANIFESTOS_PERCURSOINICIAL',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'MANIFESTOS_PERCURSOFINAL',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 2}
            ]
        },
        {
            name: 'MANIFESTOS_ESTADOS',      
            validators: [
                {type: 'length', max: 100}
            ]
        },
        {
            name: 'MANIFESTOS_QUANTIDADENFE',      
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_QUANTIDADECFE',      
            validators: [
                {type: 'presence'}
            ]
        },
        'MANIFESTOS_BASEICMS',
        'MANIFESTOS_BASESUBST',
        'MANIFESTOS_IPI',
        'MANIFESTOS_VALORICMS',
        'MANIFESTOS_VALORSUBST',
        'MANIFESTOS_IBPT',
        'MANIFESTOS_PESOBRUTO',
        'MANIFESTOS_FRETE',
        'MANIFESTOS_SERVICOS',
        'MANIFESTOS_PRODUTOS',
        'MANIFESTOS_PESOLIQUIDO',
        'MANIFESTOS_SEGURO',
        'MANIFESTOS_DESCONTOS',
        'MANIFESTOS_TOTAL',
        {
            name: 'MANIFESTOS_SEGURADORA',      
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MANIFESTOS_APOLICE',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MANIFESTOS_AVERBACAO',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MANIFESTOS_CONTRATANTE',
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        {
            name: 'MANIFESTOS_PREDOMINANTE',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MANIFESTOS_NCM',
            validators: [
                {type: 'length', max: 10}
            ]
        },
        {
            name: 'MANIFESTOS_NFE',      
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MANIFESTOS_PROTOCOLO',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MANIFESTOS_ID_CARREGAMENTO',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_CEPORIGEM',
            type: 'mask',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MANIFESTOS_CEPDESTINO',
            type: 'mask',
            validators: [
                {type: 'presence'}
            ]
        },
        'CIDADES_IBGE',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        {
            name: 'MANIFESTOS_EMAIL',      
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MANIFESTOS_SAIDA',
            type: 'nodejsdate'
        },
        {
            name: 'MANIFESTOS_OBSERVACOES',
            validators: [
                {type: 'length', max: 512}
            ]
        }
    ]
});
