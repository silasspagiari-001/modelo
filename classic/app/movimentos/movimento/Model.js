Ext.define('SamosAdmin.movimentos.movimento.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOS_ID',

    requires: [
        'SamosFinanceiros.titulos.ModelCaixa'
    ],

    proxy: {
        type: 'nodejsrest',
        url: 'server/movimentos',
        timeout: 600000000
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOS_ID_EMPRESAORIGEM': 0,
            'MOVIMENTOS_NUMEROORIGEM'    : 0,
            'MOVIMENTOS_SERIEORIGEM'     : '',
            'MOVIMENTOS_ID_EMPRESAS'     : configs.getEmpresa().id,
            'EMPRESAS_AMBIENTE'          : configs.getEmpresa().ambiente,
            'EMPRESAS_FANTASIA'          : configs.getEmpresa().nome,
            'MOVIMENTOS_ID_PROPRIEDADES' : 0,
            'MOVIMENTOS_ID_CUSTOS'       : configs.getClientName() == 'prudenmoveis' ? 0 : 1,
            'MOVIMENTOS_HORA'            : momentServer().format('HH:mm:ss'),
            'MOVIMENTOS_EMISSAO'         : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOS_ENTRADASAIDA'    : '1899-12-30',
            'MOVIMENTOS_STATUS'          : 'N',
            'MOVIMENTOS_ID_PRAZOS'       : configs.getClientName() == 'bellar' ? 1 : 12,
            'PRAZOS_NOME'                : '',
            'MOVIMENTOS_SITUACAO'        : configs.getMovimentos().entrega.situacao,
            'MOVIMENTOS_LOG'             : SamosUtils.Info.getLog(),
            'MOVIMENTOS_ID_USUARIOS'     : configs.getMovimentos().carregaVendedor ? configs.getUsuario().id   : '',
            'USUARIOS_NOME'              : configs.getMovimentos().carregaVendedor ? configs.getUsuario().nome : '',
            'USUARIOS_LOGIN'             : configs.getUsuario().login,
            'PORTADORES_ID'              : configs.getFinanceiros().portadorDefault || 0,
            'PORTADORES_MULTI'           : (configs.getFinanceiros().portadores || []).filter(empresa => empresa[2] == configs.getEmpresa().id),
            'MOVIMENTOS_NFE'             : '',
            'MOVIMENTOS_PROTOCOLO'       : '',
            'MOVIMENTOS_BASEICMS'        : 0,
            'MOVIMENTOS_VALORICMS'       : 0,
            'MOVIMENTOS_BASEST'          : 0,
            'MOVIMENTOS_VALORST'         : 0,
            'MOVIMENTOS_VALORIPI'        : 0,
            'MOVIMENTOS_IMPOSTO'         : 0,
            'MOVIMENTOS_FRETE'           : 0,
            'MOVIMENTOS_DESCONTOS'       : 0,
            'MOVIMENTOS_PERCENTUAL'      : 0,
            'MOVIMENTOS_PRODUTOS'        : 0,
            'MOVIMENTOS_SEGURO'          : 0,
            'MOVIMENTOS_DESPESAS'        : 0,
            'MOVIMENTOS_MARGEM'          : 0,
            'MOVIMENTOS_VALORRETENCAO'   : 0,
            'MOVIMENTOS_TOTAL'           : 0,            
            'MOVIMENTOS_OBSERVACOES'     : '||||||||',
            'MOVIMENTOS_CAIXA'           : [Ext.create('SamosFinanceiros.titulos.ModelCaixa', { 'MOVIMENTOSCAIXA_ID': -1 }).data],
            'MOVIMENTOS_FORMASPAGAMENTO' : [Ext.create('SamosAdmin.movimentos.movimento.ModelFormaPagamento',   { 'MOVIMENTOSFORMAS_ID': -1 }).data],
            'MOVIMENTOS_ENVIO'           : [Ext.create('SamosAdmin.movimentos.movimento.form.transporte.Model', { 'MOVIMENTOSENVIO_ID' : -1 }).data],
            'MOVIMENTOS_ITENSANTIGOS'    : []
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOS_ID',
        'ABERTO_FINANCEIROPESSOA',
        {
            name: 'MOVIMENTOS_NUMERO', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'MOVIMENTOS_SERIE', 
            critical: true,
            validators: [
                {type: 'presence'},
                {type: 'length', max: 3}
            ]
        },   
        {
            name: 'MOVIMENTOS_SITUACAO',     
            critical: true
        },   
        {
            name: 'MOVIMENTOS_ID_DOCUMENTOS',     
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        {
            name: 'DOCUMENTOS_NOME',     
            critical: true
        },
        'DOCUMENTOS_ID_PESSOAS',
        'DOCUMENTOS_ID_OPERACOES',
        'CONSUMIDOR_CIDADESNOME', 
        'CONSUMIDOR_CIDADESESTADO',  
        'DOCUMENTOS_ALTERAPRECO', 
        'DOCUMENTOS_DESCONTOITEM', 
        'DOCUMENTOS_COLETACARTAO', 
        'DOCUMENTOS_COLETACHEQUE', 
        'DOCUMENTOS_COLETATRANSPORTE', 
        'DOCUMENTOS_COLETAENTREGA',
        'DOCUMENTOS_COLETAOUTRO',
        'DOCUMENTOS_LAYOUT',
        {
            name: 'MOVIMENTOS_ID_EMPRESAS', 
            critical: true,   
            validators: [
                {type: 'presence'}
            ]
        }, 
        {
            name: 'EMPRESAS_FANTASIA',
            critical: true
        },
        {
            name: 'EMPRESAS_CPFCNPJ',
            critical: true
        },
        {
            name: 'EMPRESAS_CNAE',
            critical: true
        },
        {
            name: 'EMPRESAS_SIMPLES',
            critical: true
        },
        {
            name: 'EMPRESAS_ID_CIDADES',
            critical: true
        },
        'EMPRESAS_AMBIENTE', 
        {
            name: 'MOVIMENTOS_NOME',      
            validators: [
                {type: 'presence'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_ID_PESSOAS', 
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_ID_PROPRIEDADES',      
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_CPFCNPJ',
            type: 'mask',
            validators: [
                {type: 'cpfcnpj'}
            ]
        },
        'PESSOAS_ENDERECO',
        'PESSOAS_EMAIL',
        'PESSOAS_PAGINA',
        'PESSOAS_NUMERO',
        'PESSOAS_BAIRRO',
        'PESSOAS_CEP',
        'PESSOAS_CPFCNPJ',
        'PESSOAS_INSCRICAO',
        'PESSOAS_TELEFONE',
        'PESSOAS_CELULAR',
        {
            name: 'PESSOAS_ID_USUARIOS',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },   
        'XML_AUTOMATICO',
        'VCTO_FIXO',
        'PROPRIEDADES_ID_PESSOAS',
        'PROPRIEDADES_ENDERECO',
        'PROPRIEDADES_NUMERO',
        'PROPRIEDADES_BAIRRO',
        'PROPRIEDADES_CEP',
        'PROPRIEDADES_INSCRICAO',
        'PROPRIEDADES_TELEFONE',

        {
            name: 'MOVIMENTOS_CELULAR',      
            validators: [
                {type: 'length', max: 15}
            ]
        },
        'PESSOAS_CREDITO',
        'PESSOAS_DESCONTO',
        'PESSOAS_STATUS',
        'PESSOAS_TIPO',
        'PESSOAS_CATEGORIA',        
        'PESSOAS_OBSERVACOES',
        'PESSOAS_ID_CIDADES',
        'CIDADES_NOME',
        'CIDADES_ESTADO',
        'CIDADES_IBGE',
        'CIDADES_NOMEPROPRIEDADE',
        'CIDADES_ESTADOPROPRIEDADE',

        {
            name: 'MOVIMENTOS_EMAIL',
            validators: [
                {type: 'email'},
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_EMISSAO',
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_HORA',//VARCHAR(10)
            critical: true
        },
        {
            name: 'MOVIMENTOS_ENTRADASAIDA',    // DATE
            type: 'nodejsdate',
            critical: true,
            validators: [
                {type: 'presence'}
            ]            
        },
        {
            name: 'MOVIMENTOS_STATUS',         // CHAR(1),
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_ID_USUARIOS',   
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'USUARIOS_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'USUARIOS_LOGIN',
            critical: true
        },
        {
            name: 'MOVIMENTOS_ID_APLICACOES', 
            validators: [
                {type: 'presence'}
            ]
        },
        'APLICACOES_NOME',
        {
            name: 'MOVIMENTOS_ID_CUSTOS',
            critical: true
        },
        'CUSTOS_NOME',
        {
            name: 'MOVIMENTOS_ID_PRAZOS', 
            critical: true,      
            validators: [
                {type: 'presence'}
            ]
        },
        'PRAZOS_NOME',
        'PRAZOS_PARCELAS',
        'PRAZOS_PARCELAMENTO',
        'PRAZOS_EXPORTADO',
        'CHEQUES_ID_BANCOS',
        'CHEQUES_AGENCIA',
        'CHEQUES_CONTA',
        'CHEQUES_NUMERO',
        'CHEQUES_CPFCNPJ',
        'MOVIMENTOS_LOG',
        {
            name: 'MOVIMENTOS_ID_OPERACOES',
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        'OPERACOES_NOME',
        'OPERACOES_UNICA',
        'OPERACOES_FINALIDADE',
        {
            name: 'OPERACOES_ACAO',
            critical: true
        },
        {
            name: 'OPERACOES_TIPO',
            critical: true
        },
        {
            name: 'OPERACOES_ST',
            critical: true
        },
        {
            name: 'OPERACOES_PISCOFINS',
            critical: true
        },
        {
            name: 'OPERACOES_ESTOQUE',
            critical: true
        },
        {
            name: 'OPERACOES_FINANCEIRO',
            critical: true
        },
        'OPERACOES_BAIXAVISTA',
        'OPERACOES_ID_APLICACOES',
        {
            name: 'OPERACOES_COMPLEMENTAR',
            critical: true
        },
        {
            name: 'PERCENTUAL_IPI',
            critical: true
        },
        {
            name: 'PERCENTUAL_FRETE',
            critical: true            
        },
        {
            name: 'PERCENTUAL_SEGURO',
            critical: true            
        },        
        {
            name: 'APLICACOES_ID',
            validators: [
                {type: 'presence'}
            ],
            critical: true            
        },
        {
            name: 'APLICACOES_NOME',            
            critical: true            
        },
        {
            name: 'CENTROCUSTO_ID',
            validators: [
                {type: 'presence'}
            ],
            critical: true            
        },
        {
            name: 'VETERINARIOS_ID',
            validators: [
                {type: 'presence'}
            ],
            critical: true            
        },
        {
            name: 'VETERINARIOS_NOME',
            validators: [
                {type: 'presence'}
            ],
            critical: true            
        },
        {
            name: 'VETERINARIOS_CPFCNPJ',
            validators: [
                {type: 'presence'}
            ],
            critical: true            
        },
        {
            name: 'MOVIMENTOS_NFE',             // VARCHAR(128),
            critical: true,
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'MOVIMENTOS_PROTOCOLO',       // VARCHAR(15),
            critical: true,
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'MOVIMENTOS_BASEICMS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_VALORICMS',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_BASEST',          // NUMERIC(12,2)
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_VALORST',         // NUMERIC(12,2)
            critical: true,
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_VALORIPI',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_FRETE',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_IMPOSTO',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_DESCONTOS',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_PERCENTUAL',       // NUMERIC(7,3)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_PRODUTOS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_SEGURO',          // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_DESPESAS',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOS_MARGEM', 
        {
            name: 'MOVIMENTOS_VALORRETENCAO',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOS_TOTAL',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOS_ID_EMPRESAORIGEM',
        'MOVIMENTOS_NUMEROORIGEM',
        'MOVIMENTOS_SERIEORIGEM',
        {
            name: 'MOVIMENTOS_OBSERVACOES',    // VARCHAR(512),
            critical: true,
            validators: [
                {type: 'length', max: 512}
            ]
        },
        {
            name: 'MOVIMENTOS_ITENSANTIGOS',
            critical: true
        },
        'MOVIMENTOS_ITENS',                     // lista de ModelItens
        {
            name: 'MOVIMENTOS_ENVIO',
            critical: true
        },
        'MOVIMENTOS_CARTAS',                    // lista de Cartas de Correção
        'MOVIMENTOS_CAIXA',                     // lista de Caixa
        'MOVIMENTOS_FORMASPAGAMENTO',           // lista de Formas de Pagamentos (ORC)
        'MOVIMENTOS_CARTOES',                   // lista de Cartoes
        'MOVIMENTOS_CHEQUES',                   // lista de Cheques
        'MOVIMENTOS_ROMANEIOS',                 // lista de Romaneios
        'MOVIMENTOS_BASEIBSCBS',                // Campos IBS/CBS
        'MOVIMENTOS_ALIQUOTAIBS',
        'MOVIMENTOS_VALORIBS',
        'MOVIMENTOS_ALIQUOTACBS',
        'MOVIMENTOS_VALORCBS',
        {
            name: 'MOVIMENTOS_FINANCEIROS',
            critical: true
        },
        {
            name: 'PORTADORES_ID',
            critical: true
        },
        {
            name: 'PORTADORES_MULTI', // Lista de portadores com boletos na empresa
            critical: true
        }
    ]
});
