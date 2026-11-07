Ext.define('SamosAdminModern.pedidos.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID',
    idParent: 'MOVIMENTOSITENS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSITENS_QUANTIDADE'    : 0,
            'MOVIMENTOSITENS_ALIQUOTAPIS'   : 0,
            'MOVIMENTOSITENS_CSTPIS'        : 0,
            'MOVIMENTOSITENS_BASEPIS'       : 0,
            'MOVIMENTOSITENS_VALORPIS'      : 0,
            'MOVIMENTOSITENS_VALORPISST'    : 0,            
            'MOVIMENTOSITENS_ALIQUOTACOFINS': 0,
            'MOVIMENTOSITENS_CSTCOFINS'     : 0,
            'MOVIMENTOSITENS_BASECOFINS'    : 0,
            'MOVIMENTOSITENS_VALORCOFINS'   : 0,
            'MOVIMENTOSITENS_VALORCOFINSST' : 0,
            'MOVIMENTOSITENS_BASEICMS'      : 0,
            'MOVIMENTOSITENS_ICMS'          : 0,
            'MOVIMENTOSITENS_VALORICMS'     : 0,
            'MOVIMENTOSITENS_IPI'           : 0,
            'MOVIMENTOSITENS_VALORIPI'      : 0,
            'MOVIMENTOSITENS_BASEST'        : 0,
            'MOVIMENTOSITENS_VALORST'       : 0,
            'MOVIMENTOSITENS_FRETE'         : 0,
            'MOVIMENTOSITENS_SEGURO'        : 0,
            'MOVIMENTOSITENS_DESPESAS'      : 0,
            'MOVIMENTOSITENS_DESCONTOS'     : 0,
            'MOVIMENTOSITENS_PERCENTUAL'    : 0,
            'MOVIMENTOSITENS_MARGEM'        : 0,            
            'MOVIMENTOSITENS_IMPOSTO'       : 0,
            'MOVIMENTOSITENS_CST'           : '000',
            'MOVIMENTOSITENS_ESCRITURACAO'  : '2',
            'MOVIMENTOSITENS_EXCECAO'       : '0',
            'MOVIMENTOSITENS_ENTREGUE'      : 0,
            'MOVIMENTOSITENS_DEPOSITO'      : 0,
            'MOVIMENTOSITENS_IMEDIATA'      : 0,
            'MOVIMENTOSITENS_ID_LOTES'      : 0,            
            'MOVIMENTOSITENS_ID_EMPRESAS'   : configs.getEmpresa().id,
            'EMPRESAS_FANTASIA'             : configs.getEmpresa().nome,
            'MOVIMENTOSITENS_DATAENTREGA'   : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOSITENS_DATAMONTAGEM'  : '1899-12-30',
            'MOVIMENTOSITENS_HORAENTREGA'   : '',
            'MOVIMENTOSITENS_HORAMONTAGEM'  : '',
            'ROMANEIOSENTREGA_NUMERO'       : 0,
            'ROMANEIOSMONTAGEM_NUMERO'      : 0
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSITENS_ID',                         // INTEGER NOT NULL
        'MOVIMENTOSITENS_ID_MOVIMENTOS',              // INTEGER NOT NULL
        'MOVIMENTOSITENS_ID_OPERACOES',               // INTEGER NOT NULL
        'OPERACOES_NOME',
        {
            name: 'MOVIMENTOSITENS_ID_PRODUTOS',      // INTEGER NOT NULL
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_STATUS',
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_NOME',
            validators: [
                {type: 'length', max: 100}
            ]
        },
        'PRODUTOS_DERIVADO',
        'PRODUTOS_MARCA',
        'PRODUTOS_APLICACAO',
        'PRODUTOS_FABRICA',
        'PRODUTOS_PESOLIQUIDO',
        'PRODUTOS_PESOBRUTO',
        {
            name: 'MOVIMENTOSITENS_QUANTIDADE',       // NUMERIC(12,2)
/*            validators: [
                {type: 'range', min: 0.001, allowBlank: false}
            ]*/
        },
        {
            name: 'MOVIMENTOSITENS_PRECO',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_CUSTO',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSITENS_MARGEM',
        {
            name: 'MOVIMENTOSITENS_DATAENTREGA',         // DATE
            type: 'nodejsdate'
        },
        {
            name: 'MOVIMENTOSITENS_DATAMONTAGEM',         // DATE
            type: 'nodejsdate'
        },
        'MOVIMENTOSITENS_ENTREGUE',
        'ITENS_ENTREGAR',
        'MOVIMENTOSITENS_DEPOSITO',
        'MOVIMENTOSITENS_IMEDIATA',
        'ROMANEIOSITENS_ENTREGAR',
        'MOVIMENTOSITENS_ID_LOTES',
        'MOVIMENTOSITENS_ID_EMPRESAS',
        'EMPRESAS_FANTASIA',
        'MOVIMENTOSITENS_HORAENTREGA',
        'MOVIMENTOSITENS_HORAMONTAGEM',
        'SALDOS_PRAZO',
        'SALDOS_PRECO',
        'SALDOS_PRECOMINIMO',
        'VALOR_PROMOCAO',
        'SALDOS_CUSTO',
        'SALDOS_COMPRA',
        'SALDOS_MARGEM',
        'SALDOS_LOCAL',
        'MOVIMENTOSITENS_DESCONTOS',       // NUMERIC(12,2)
        'MOVIMENTOSITENS_PERCENTUAL',       // NUMERIC(12,2)
        'TOTAL_LIQUIDO',
        'VALOR_LIQUIDO',
        'MOVIMENTOSITENS_TOTAL',           // NUMERIC(12,2)
        {
            name: 'MOVIMENTOSITENS_CST',            // INTEGER
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSITENS_ESCRITURACAO',
        'MOVIMENTOSITENS_EXCECAO',
        'SALDOS_CSTLOCAL',
        'SALDOS_CSTOUTROS',
        'NCMS_NCM',
        'NCMS_ALIQUOTANACIONAL',
        'NCMS_ALIQUOTAESTADUAL',
        'NCMS_ALIQUOTAIMPORTADO',
        'NCMS_ALIQUOTAMUNICIPAL',
        'NCMS_CSTPIS',
        'NCMS_ALIQUOTAPIS',
        'NCMS_CSTCOFINS',
        'NCMS_ALIQUOTACOFINS',
        'NCMS_ALIQUOTAFCP',
        'SALDOS_IPI',
        'SALDOS_ICMSLC',
        'SALDOS_ICMS01',
        'SALDOS_ICMS02',
        'SALDOS_BASELC',
        'SALDOS_BASE01',
        'SALDOS_BASE02',
        'SALDOS_TRANSFERENCIA',
        'SALDOS_DISPONIVEL',
        'SALDOS_DEPOSITO',
        'ITENS_DEVOLUCAO',
        'MONTAGENS_VALOR',
        {
            name: 'MOVIMENTOSITENS_ICMS',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSITENS_ALIQUOTAPIS',
        'MOVIMENTOSITENS_CSTPIS',
        'MOVIMENTOSITENS_BASEPIS',
        'MOVIMENTOSITENS_VALORPIS',
        'MOVIMENTOSITENS_VALORPISST',        
        'MOVIMENTOSITENS_ALIQUOTACOFINS',
        'MOVIMENTOSITENS_CSTCOFINS',
        'MOVIMENTOSITENS_BASECOFINS',
        'MOVIMENTOSITENS_VALORCOFINS',
        'MOVIMENTOSITENS_VALORCOFINSST',
        {
            name: 'MOVIMENTOSITENS_BASEICMS',      // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_VALORICMS',      // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_IPI',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_VALORIPI',      // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_BASEST',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_VALORST',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_FRETE',         // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_SEGURO',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_DESPESAS',      // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_IMPOSTO',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        'ROMANEIOSENTREGA_NUMERO',
        'ROMANEIOSMONTAGEM_NUMERO'
    ]
});
