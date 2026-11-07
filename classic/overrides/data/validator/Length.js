Ext.define('Overrides.data.validator.Length', {
    override: 'Ext.data.validator.Length',
    
    /*
     * Override:
     * pt-BR transate
     */
    config: {
        minOnlyMessage: 'Mínimo de {0} caracteres',
        maxOnlyMessage: 'Máximo de {0} caracteres',
        bothMessage: 'Entre {0} e {1} caracteres'
    }
});