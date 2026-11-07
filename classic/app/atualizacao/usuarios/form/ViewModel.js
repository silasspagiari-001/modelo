Ext.define('SamosAdmin.atualizacao.usuarios.form.ViewModel', {
    extend: 'SamosModule.form.ViewModel',
    alias: 'viewmodel.formusuarios',

    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hidePermissoes: function(get) {
                return get('updating');
            },

            isSupervisor: function(get) {
                return configs.getUsuario().privilegiado;
            },

            isPrudenMoveis: function(get) {
                return configs.getClientName() == 'prudenmoveis';
            },

            getUrlImage: async function (get) {
                const foto = get('model.FOTO') || '';

                if(foto == 'sem_foto') {
                    this.set('urlImage', location.href + 'resources/images/sem_foto.jpg');
                } else if(foto.slice(0, 4) == 'data') {
                    this.set('urlImage', foto);
                } else {
                    this.set('urlImage', configs.getApiNode() + foto);
                }
            },

            isCepUnico: function(get) {
                var cep = get('model.USUARIOS_CEP');

                let sufixo = (cep || '').substring(5, 8);

                return sufixo == '000';
            }               
        });
    }
});
