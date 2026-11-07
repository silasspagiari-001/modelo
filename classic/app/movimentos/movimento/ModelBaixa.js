Ext.define('SamosAdmin.movimentos.movimento.ModelBaixa', {
    extend: 'Ext.data.NodeJSModel',
    idProperty: 'CREDITOS_ID',
    idParent: 'CREDITOS_ID_MOVIMENTOS',

    proxy: {
        type: 'nodejsrest'
    },

    constructor: function () {
        this.defaultValues = {
            'CREDITOS_ID'            : -1,    
            'CREDITOS_ID_MOVIMENTOS' : 0,
            'CREDITOS_EMISSAO'       : moment().format('YYYY-MM-DD'),
            'CREDITOS_ID_PESSOAS'    : 0, 
            'CREDITOS_STATUS'        : 'C',    
            'CREDITOS_TIPO'          : 'B', //tipo B de baixa        
            'CREDITOS_NOME'          : '',          
            'CREDITOS_VALOR'         : 0,     
            'CREDITOS_LOG'           : ( SamosUtils.Info.getLog() )
        };

        this.callParent(arguments);
    },

    fields: [
        'CREDITOS_ID',    
        'CREDITOS_ID_MOVIMENTOS',
        'CREDITOS_EMISSAO',
        'CREDITOS_ID_PESSOAS', 
        'CREDITOS_STATUS',    
        'CREDITOS_TIPO',       
        'CREDITOS_NOME',          
        'CREDITOS_VALOR',     
        'CREDITOS_LOG'
    ]
});
