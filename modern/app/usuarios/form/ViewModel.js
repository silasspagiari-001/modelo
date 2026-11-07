Ext.define('SamosAdminModern.usuarios.form.ViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.usuariosform',
    
    constructor: function() {
        this.callParent(arguments);

        this.setFormulas({
            hideSenha: function(get) {
                return !configs.getUsuario().privilegiado;
            }
        })
    }
});
