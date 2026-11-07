Ext.define('SamosAdmin.movimentos.conhecimento.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CONHECIMENTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/conhecimento',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'CONHECIMENTOS_ID_EMPRESAS'  : configs.getEmpresa().id,
            'EMPRESAS_AMBIENTE'          : configs.getEmpresa().ambiente,
            'CONHECIMENTOS_ID_OPERACOES' : 135300,
            'OPERACOES_NOME'             : 'SERV TRANSPORTE',
            'CONHECIMENTOS_HORA'         : momentServer().format('HH:mm:ss'),
            'CONHECIMENTOS_EMISSAO'      : momentServer().format('YYYY-MM-DD'),
            'CONHECIMENTOS_ENTREGA'      : momentServer().format('YYYY-MM-DD'),
            'CONHECIMENTOS_LOG'          : SamosUtils.Info.getLog(),
            'CONHECIMENTOS_STATUS'       : 'N',
            'CONHECIMENTOS_TIPOCTE'      : 'N',
            'CONHECIMENTOS_TIPOSERVICO'  : 'N',
            'CONHECIMENTOS_TOMADOR'      : 'R',
            'CONHECIMENTOS_FORMAPGTO'    : 'P',
            'CONHECIMENTOS_QUANTIDADE'   : 0,
            'CONHECIMENTOS_RESPONSAVEL'  : 'R',
            'CONHECIMENTOS_ADIANTADO'    : 0,
            'CONHECIMENTOS_SERVICOS'     : 0,
            'CONHECIMENTOS_RECEBER'      : 0,
            'CONHECIMENTOS_MERCADORIA'   : 0,
            'CONHECIMENTOS_BASEICMS'     : 0,
            'CONHECIMENTOS_ALIQUOTAICMS' : 0,
            'CONHECIMENTOS_VALORICMS'    : 0,
            'CONHECIMENTOS_REDUCAO'      : 0,
            'CONHECIMENTOS_PESOLIQUIDO'  : 0,
            'CONHECIMENTOS_CSTCSON'      : '000',
            'CONHECIMENTOS_OBSERVACOES'  : ''
        };

        this.callParent(arguments);
    },

    fields: [
        'CONHECIMENTOS_ID',
        {
            name: 'CONHECIMENTOS_ID_DOCUMENTOS',
            critical: true
        },
        {
            name: 'CONHECIMENTOS_ID_EMPRESAS', 
            critical: true
        },  
        'EMPRESAS_AMBIENTE',  
        {
            name: 'CONHECIMENTOS_NUMERO', 
            critical: true
        },   
        {
            name: 'CONHECIMENTOS_SERIE', 
            critical: true
        }, 
        {
            name: 'CONHECIMENTOS_EMISSAO',
            type: 'nodejsdate',
            validators: [
                {type: 'presence'}
            ]
        }, 
        'CONHECIMENTOS_HORA',
        {
            name: 'CONHECIMENTOS_ID_PESSOAS',  
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
        'PESSOAS_UF', 
        {
            name: 'CONHECIMENTOS_ID_DESTINATARIO',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'DESTINATARIO_NOME', 
            validators: [
                {type: 'presence'}
            ]
        },
        'DESTINATARIO_UF', 
        {
            name: 'CONHECIMENTOS_ID_EXPEDIDOR'
        },
        {
            name: 'EXPEDIDOR_NOME'
        },
        'EXPEDIDOR_UF', 
        {
            name: 'CONHECIMENTOS_ID_RECEBEDOR'
        },
        {
            name: 'RECEBEDOR_NOME'
        },
        'RECEBEDOR_UF', 
        {
            name: 'CONHECIMENTOS_ID_TOMADOR'
        },
        {
            name: 'TOMADOR_NOME'
        },
        'TOMADOR_UF',
        {
            name: 'CONHECIMENTOS_TIPOCTE',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_TIPOSERVICO',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_TOMADOR',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_FORMAPGTO',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_ID_OPERACOES',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'OPERACOES_NOME', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_ID_PRAZOS',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRAZOS_NOME', 
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_ID_ORIGEM',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'ORIGEM_IBGE',  
            validators: [
                {type: 'presence'}
            ]
        },
        'ORIGEM_NOME', 
        'ORIGEM_UF', 
        {
            name: 'CONHECIMENTOS_ID_DESTINO',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'DESTINO_IBGE',  
            validators: [
                {type: 'presence'}
            ]
        },
        'DESTINO_NOME', 
        'DESTINO_UF',
        {
            name: 'CONHECIMENTOS_PRODUTO',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'CONHECIMENTOS_QUANTIDADE',    
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_ENTREGA',
            type: 'nodejsdate'
        },
        {
            name: 'CONHECIMENTOS_STATUS',
            critical: true
        },
        'CONHECIMENTOS_LOG',
        {
            name: 'CONHECIMENTOS_RESPONSAVEL',  
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'CONHECIMENTOS_SEGURADORA',     
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'CONHECIMENTOS_APOLICE',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 10}
            ]
        },
        {
            name: 'CONHECIMENTOS_AVERBACAO',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 10}
            ]
        },
        'CONHECIMENTOS_BASEICMS',
        'CONHECIMENTOS_ALIQUOTAICMS',
        'CONHECIMENTOS_VALORICMS',
        'CONHECIMENTOS_REDUCAO',
        'CONHECIMENTOS_PESOLIQUIDO',
        'CONHECIMENTOS_CSTCSON',
        'CONHECIMENTOS_ADIANTADO',
        'CONHECIMENTOS_SERVICOS',
        'CONHECIMENTOS_RECEBER',
        'CONHECIMENTOS_MERCADORIA',
        {
            name: 'CONHECIMENTOS_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'CONHECIMENTOS_NFE',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'CONHECIMENTOS_PROTOCOLO',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'CONHECIMENTOS_OBSERVACOES',
            validators: [
                {type: 'length', max: 512}
            ]
        }
    ]
});
