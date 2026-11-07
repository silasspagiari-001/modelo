Ext.define('SamosAdmin.atualizacao.produtos.Model', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'PRODUTOS_ID',

    proxy: {
        type: 'nodejsrest',
        url: 'server/produtos'
   },

    constructor: function () {
        this.defaultValues = {
            'PRODUTOS_STATUS'       : configs.getProdutos().statusConsultaPreco,
            'PRODUTOS_DERIVADO'     : 'F',
            'PRODUTOS_EDITAVEL'     : 'F',            
            'PRODUTOS_PESOLIQUIDO'  : 0,
            'PRODUTOS_PESOBRUTO'    : 0,
            'PRODUTOS_BARRA'        : '',
            'PRODUTOS_FABRICA'      : '',
            'PRODUTOS_MARCA'        : '',
            'PRODUTOS_REFERENCIA'   : '',            
            'PRODUTOS_APLICACAO'    : '',
            'PRODUTOS_ID_MONTAGENS' : 1,
            'PRODUTOS_DESCRICAO'    : '',
            'PRODUTOS_UNIDADE'      : 'PC',
            'PRODUTOS_EMBALAGEM'    : 1,
            'PRODUTOS_CSTIBSCBS'    : '000',
            'PRODUTOS_CLASSTRIB'    : '000001',
            'MULTIPLOS_PRODUTOS'    : 1,
            'SALDOS_ID'             : -1,//força a criação como novo item
            'SALDOS_ID_PRODUTOS'    : 0,//força a criação como novo item
            'SALDOS_ALIQUOTACFE'    : 0,
            'SALDOS_CSTLOCAL'       : configs.getProdutos().cstlocalPadrao  || '0500',
            'SALDOS_CSTOUTROS'      : configs.getProdutos().cstoutrosPadrao || '0500',
            'TABELA_ORIGEM'         : configs.getProdutos().tabOrigemPadrao || '0',  // Combo 
            'TABELA_LOCAL'          : configs.getProdutos().tabLocalPadrao  || '00', // Combo desmembrado SALDOS_CSTLOCAL
            'TABELA_OUTROS'         : configs.getProdutos().tabOutrosPadrao || '00', // Combo desmembrado SALDOS_CSTOUTROS
            'SALDOS_LOCAL'          : '',
            'SALDOS_BENEFICIOLC'    : 'SEM CBENEF',
            'SALDOS_BENEFICIO01'    : 'SEM CBENEF',
            'SALDOS_BENEFICIO02'    : 'SEM CBENEF',
            'SALDOS_ID_EMPRESAS'    : configs.getEmpresa().id,
            'SALDOS_ESCRITURACAO'   : '2',
            'SALDOS_EXCECAO'        : '0',
            'SALDOS_MAXIMO'         : 0,
            'SALDOS_MINIMO'         : 0,
            'SALDOS_COMPRADO'       : 0,
            'SALDOS_RESERVADO'      : 0,            
            'SALDOS_COMPRA'         : 0,            
            'SALDOS_CUSTO'          : 0,
            'SALDOS_MARGEM'         : 0,
            'SALDOS_MARGEMMINIMA'   : 0,            
            'SALDOS_MARKUP'         : 0,            
            'SALDOS_TRANSFERENCIA'  : 0,            
            'SALDOS_PRECO'          : 0,
            'SALDOS_PRECOMINIMO'    : 0,
            'SALDOS_PRECOATACADO'   : 0,
            'SALDOS_PRAZO'          : 0,
            'SALDOS_COMISSAO'       : 0,
            'SALDOS_COMISSAOPRAZO'  : 0,
            'SALDOS_ICMSLC'         : configs.getProdutos().percentuaisIcms ? configs.getProdutos().percentuaisIcms.normalLocal : 0,
            'SALDOS_ICMS01'         : configs.getProdutos().percentuaisIcms ? configs.getProdutos().percentuaisIcms.normalRegiao1 : 0,
            'SALDOS_ICMS02'         : configs.getProdutos().percentuaisIcms ? configs.getProdutos().percentuaisIcms.normalRegiao2 : 0,
            'SALDOS_BASELC'         : 100,
            'SALDOS_BASE01'         : 100,
            'SALDOS_BASE02'         : 100,
            'SALDOS_ALIQUOTAPIS'    : 0,
            'SALDOS_ALIQUOTACOFINS' : 0,             
            'SALDOS_IPI'            : 0,
            'SALDOS_CSTSUBST'       : '',
            'SALDOS_ALIQUOTASUBST'  : 0,
            'CONVENIO_LOCAL'        : '',
            'CONVENIO_REGIAO12'     : '',
            'CONVENIO_OUTROS'       : ''
       };
       this.callParent(arguments);
    },
    fields: [
        'PRODUTOS_ID',
        {
            name: 'PRODUTOS_STATUS'
        },
        {
            name: 'PRODUTOS_BARRA',
            validators: [
                {type: 'length', max: 50}
            ]
        },
        {
            name: 'PRODUTOS_FABRICA',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PRODUTOS_MARCA',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PRODUTOS_REFERENCIA',
            validators: [
                {type: 'length', max: 15}
            ]
        },
        {
            name: 'PRODUTOS_UNIDADE',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 3}
            ]
        },
        {
            name: 'PRODUTOS_EMBALAGEM',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_CSTIBSCBS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_CLASSTRIB',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_NOME',
            validators: [
                {type: 'presence'},
                {type: 'length', max: 100}
            ]
        },
        {
            name: 'PRODUTOS_DESCRICAO',
            validators: [
                {type: 'length', max: 30}
            ]
        },
        {
            name: 'PRODUTOS_APLICACAO',
            validators: [
                {type: 'length', max: 512}
            ]
        },
        {
            name: 'PRODUTOS_ID_MONTAGENS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MONTAGENS_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_ID_PESSOAS',
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
        {
            name: 'PESSOAS_FORMULA',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_ID_GRUPOS',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'GRUPOS_NOME',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_ID_NCMS',
            validators: [
                {type: 'presence'}
            ]
        },
        'NCMS_NOME',
        'NCMS_NCM',
        {
            name: 'PRODUTOS_PESOLIQUIDO',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_PESOBRUTO',        // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'PRODUTOS_DERIVADO'
        },
        {
            name: 'PRODUTOS_EDITAVEL',
            type: 'check',
            defaultValue: 'F'
        },
        {
            name: 'PRODUTOS_INVENTARIO',
            type: 'check',
            defaultValue: 'T'
        },
        {
            name: 'PRODUTOS_LISTAPRECO',
            type: 'check',
            defaultValue: 'T'
        },
        'SALDOS_ID',
        'SALDOS_MAXIMO',
        'SALDOS_MINIMO',
        'SALDOS_DISPONIVEL',
        'SALDOS_COMPRADO',
        'SALDOS_RESERVADO',
        'SALDOS_COMPRA',
        'SALDOS_CUSTO',
        'SALDOS_MARGEM',
        'SALDOS_MARGEMMINIMA',
        'SALDOS_MARKUP',
        'SALDOS_TRANSFERENCIA',
        'SALDOS_PRECO',
        'SALDOS_PRECOMINIMO',
        'SALDOS_PRECOATACADO',
        'SALDOS_PRAZO',
        {
            name: 'CONVENIO_LOCAL',
            critical: true
        },
        {
            name: 'CONVENIO_REGIAO12',
            critical: true
        },
        {
            name: 'CONVENIO_OUTROS',
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
            name: 'PERCENTUAL_DESPESAS',
            critical: true
        },        
        {
            name: 'TABELA_ORIGEM',
            validators: [
                {type: 'presence'}
            ],
            critical: true
        },
        {
            name: 'TABELA_LOCAL',
            validators: [
                {type: 'presence'}
            ],
            critical: true
        },
        {
            name: 'TABELA_OUTROS',
            validators: [
                {type: 'presence'}
            ],
            critical: true
        },

        'SALDOS_BENEFICIOLC',
        'SALDOS_BENEFICIO01',
        'SALDOS_BENEFICIO02',
        'SALDOS_COMISSAO',
        'SALDOS_COMISSAOPRAZO',
        'SALDOS_ESCRITURACAO',
        'SALDOS_EXCECAO',
        'SALDOS_ALIQUOTACFE',
        'SALDOS_IPI',
        'SALDOS_ICMSLC',
        'SALDOS_ICMS01',
        'SALDOS_ICMS02',
        'SALDOS_BASELC',
        'SALDOS_BASE01',
        'SALDOS_BASE02',
        'SALDOS_ALIQUOTAPIS',
        'SALDOS_ALIQUOTACOFINS',
        'SALDOS_ALIQUOTASUBST',
        'SALDOS_CSTSUBST',
        {
            name: 'SALDOS_CSTLOCAL',
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'SALDOS_CSTOUTROS',
            validators: [
                {type: 'presence'}
            ]
        },
        'SALDOS_LOCAL',
        'SALDOS_ID_EMPRESAS',    // INTEGER NOT NULL,
        'SALDOS_ID_PRODUTOS'     // INTEGER NOT NULL
    ]
});
