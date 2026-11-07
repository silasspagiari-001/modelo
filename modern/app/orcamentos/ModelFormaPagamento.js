Ext.define('SamosAdminModern.orcamentos.ModelFormaPagamento', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'MOVIMENTOSFORMAS_ID',
    idParent: 'MOVIMENTOSFORMAS_ID_MOVIMENTOS',

    constructor: function () {
        this.defaultValues = {
            'MOVIMENTOSFORMAS_ID_MOVIMENTOS' : 0,
            'MOVIMENTOSFORMAS_STATUS'        : 'A',
            'MOVIMENTOSFORMAS_DINHEIRO'      : 0,
            'MOVIMENTOSFORMAS_DEBITO'        : 0,
            'MOVIMENTOSFORMAS_CHEQUE'        : 0,
            'MOVIMENTOSFORMAS_CREDITO'       : 0,
            'MOVIMENTOSFORMAS_PRCCREDITO'    : 0,
            'MOVIMENTOSFORMAS_VLRCREDITO'    : 0,
            'MOVIMENTOSFORMAS_CHEQUEPRE'     : 0,
            'MOVIMENTOSFORMAS_PRCCHEQUEPRE'  : 0,
            'MOVIMENTOSFORMAS_VLRCHEQUEPRE'  : 0,
            'MOVIMENTOSFORMAS_DUPLICATA'     : 0,
            'MOVIMENTOSFORMAS_PRCDUPLICATA'  : 0,
            'MOVIMENTOSFORMAS_VLRDUPLICATA'  : 0,
            'MOVIMENTOSFORMAS_FINANCEIRA'    : 0,
            'MOVIMENTOSFORMAS_PRCFINANCEIRA' : 0,
            'MOVIMENTOSFORMAS_VLRFINANCEIRA' : 0,
            'MOVIMENTOSFORMAS_TRANSFERENCIAS': 0,            
            'MOVIMENTOSFORMAS_VCTCHEQUEPRE'  : '1899-12-30',
            'MOVIMENTOSFORMAS_VCTDUPLICATA'  : '1899-12-30',
            'MOVIMENTOSFORMAS_VCTFINANCEIRA' : '1899-12-30'
        };

        this.callParent(arguments);
    },

    fields: [
        'MOVIMENTOSFORMAS_ID',
        'MOVIMENTOSFORMAS_ID_MOVIMENTOS',
        'MOVIMENTOSFORMAS_STATUS',
        'MOVIMENTOSFORMAS_DINHEIRO',
        'MOVIMENTOSFORMAS_DEBITO',
        'MOVIMENTOSFORMAS_CHEQUE',
        'MOVIMENTOSFORMAS_CREDITO',
        'MOVIMENTOSFORMAS_PRCCREDITO',
        'MOVIMENTOSFORMAS_VLRCREDITO',
        'MOVIMENTOSFORMAS_CHEQUEPRE',
        'MOVIMENTOSFORMAS_PRCCHEQUEPRE',
        'MOVIMENTOSFORMAS_VLRCHEQUEPRE',
        {
            name: 'MOVIMENTOSFORMAS_VCTCHEQUEPRE',
            type: 'nodejsdate',
        },
        'MOVIMENTOSFORMAS_DUPLICATA',
        'MOVIMENTOSFORMAS_PRCDUPLICATA',
        'MOVIMENTOSFORMAS_VLRDUPLICATA',
        {
            name: 'MOVIMENTOSFORMAS_VCTDUPLICATA',
            type: 'nodejsdate',
        },
        'MOVIMENTOSFORMAS_FINANCEIRA',
        'MOVIMENTOSFORMAS_PRCFINANCEIRA',
        'MOVIMENTOSFORMAS_VLRFINANCEIRA',
        'MOVIMENTOSFORMAS_TRANSFERENCIAS',
        {
            name: 'MOVIMENTOSFORMAS_VCTFINANCEIRA',
            type: 'nodejsdate',
        },
        'MOVIMENTOS_BASEICMS'
    ]
});
