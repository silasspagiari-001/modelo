Ext.define('SamosAdmin.movimentos.movimento.form.sefaz.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formmovimentossefaz',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideStatus: function(get) {
                return false;
            },

            hideEnviar: function(get) {
                return get('hasProtocolo') || get('isRetroativa');
            },

            hideEmitir: function(get) {
                return !get('hasProtocolo');
            },

            hideVisualizar: function(get) {
                return get('hasProtocolo');
            },

            hideConsultar: function(get) {
                return (
                  this.getView().tipo == 'MOVIMENTOS'    ? !get('model.MOVIMENTOS_NFE') : 
                  this.getView().tipo == 'MANIFESTOS'    ? !get('model.MANIFESTOS_NFE') :
                  this.getView().tipo == 'CONHECIMENTOS' ? !get('model.CONHECIMENTOS_NFE') :
                  !get('hasProtocolo')
                );
            },

            hideEncerramento: function(get){
                return this.getView().tipo != 'MANIFESTOS' || 
                       //Se for um manifesto que foi encerrado
                       (this.getView().tipo == 'MANIFESTOS' && get('model').get('MANIFESTOS_STATUS') == 'R' );
            },

            hideCartasdeCorrecao: function(get) {
                return get('isRecusado')  ||
                       get('isDevolvido') ||
                       !get('hasProtocolo') ||                       
                       this.getView().tipo != 'MOVIMENTOS';
            },

            hideInutilizar: function(get) {
                return !configs.getUsuario().privilegiado ||
                       this.getView().tipo != 'MOVIMENTOS'
            },

            hideCancelamento: function(get) {
                return !get('hasProtocolo') ||
                        get('isRecusado')  ||
                        get('isDevolvido') ||
                        get('isDenegado')  ||
                        get('isCancelado');
            },

            hideRecusada: function(get) {
                return !configs.getUsuario().privilegiado || 
                       get('isRecusado')  ||
                       get('isDevolvido') ||
                       get('isDenegado')  ||
                       get('isCancelado') ||
                       !get('hasProtocolo');
            },

            hideEnviarEmail: function(get) {
                return !get('hasProtocolo');
            },

            hideDevolvida: function(get) {
                return !configs.getUsuario().privilegiado || 
                       get('isRecusado')  ||
                       get('isDevolvido') ||
                       get('isDenegado')  ||
                       get('isCancelado') ||
                       !get('hasProtocolo');
            },

            hideOpcoes: function(get) {
                return !get('hasProtocolo') && !get('isRetroativa');
            },

            isRetroativa: function(get) {
                return (
                    this.getView().tipo == 'MOVIMENTOS' &&
                    get('model.MOVIMENTOS_PROTOCOLO') == '' &&
                    moment(get('model.MOVIMENTOS_EMISSAO')).isBefore(moment().startOf('month'))
                );  
            }
        });
    }
});
