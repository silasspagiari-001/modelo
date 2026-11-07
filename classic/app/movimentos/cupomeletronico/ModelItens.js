Ext.define('SamosAdmin.movimentos.cupomeletronico.ModelItens', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSITENS_ID',
    idParent: 'MOVIMENTOSITENS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSITENS_QUANTIDADE'    : 0,
            'MOVIMENTOSITENS_DESCONTOS'     : 0,
            'MOVIMENTOSITENS_PERCENTUAL'    : 0,
            'MOVIMENTOSITENS_IMPOSTO'       : 0,
            'MOVIMENTOSITENS_CST'           : '000',
            'MOVIMENTOSITENS_ENTREGUE'      : 0,
            'MOVIMENTOSITENS_ID_LOTES'      : 0,
            'MOVIMENTOSITENS_ID_EMPRESAS'   : configs.getEmpresa().id,
            'MOVIMENTOSITENS_DATAENTREGA'   : momentServer().format('YYYY-MM-DD'),
            'MOVIMENTOSITENS_HORAENTREGA'   : ''
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSITENS_ID',                         // INTEGER NOT NULL
        'MOVIMENTOSITENS_ID_MOVIMENTOS',              // INTEGER NOT NULL
        'MOVIMENTOSITENS_ID_OPERACOES',               // INTEGER NOT NULL
        {
            name: 'MOVIMENTOSITENS_ID_PRODUTOS',      // INTEGER NOT NULL
            critical: true,            
            validators: [
                {type: 'presence'}
            ]
        },
        'MOVIMENTOSITENS_QUANTIDADE',
        {
            name: 'MOVIMENTOSITENS_PRECO',           // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        },
        {
            name: 'MOVIMENTOSITENS_DATAENTREGA',         // DATE
            type: 'nodejsdate'
        },
        'MOVIMENTOSITENS_ENTREGUE',
        'MOVIMENTOSITENS_ID_LOTES',        
        'MOVIMENTOSITENS_ID_EMPRESAS',
        'MOVIMENTOSITENS_HORAENTREGA',
        'SALDOS_PRAZO',
        'SALDOS_PRECO',
        'VALOR_PROMOCAO',
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
        'SALDOS_CSTLOCAL',
        'NCMS_NCM',
        'NCMS_STATUS',
        'NCMS_ALIQUOTANACIONAL',
        'NCMS_ALIQUOTAESTADUAL',
        'NCMS_ALIQUOTAMUNICIPAL',
        'SALDOS_DISPONIVEL',
        {
            name: 'MOVIMENTOSITENS_IMPOSTO',       // NUMERIC(12,2)
            validators: [
                {type: 'presence'}
            ]
        }
    ]
});
