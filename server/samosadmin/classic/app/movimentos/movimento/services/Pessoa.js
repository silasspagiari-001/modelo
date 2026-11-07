Ext.define('SamosAdmin.movimentos.movimento.services.Pessoa', {
    alternateClassName: 'Movimento.services.Pessoa',
    singleton: true,

    exibir: function() {
        const janelaPessoa = Ext.$('formmovimentospessoa')[0];

        try {
            janelaPessoa.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formmovimentos')[0];
        const modelPessoa = Ext.create(
            'SamosAdmin.movimentos.movimento.form.pessoa.Model', 
        );
        const viewPessoa = Ext.create({
            xtype: 'formmovimentospessoa'
        });
        
        viewPessoa.getViewModel().set({
            model: modelPessoa,
            readOnly: false
        });

        viewPessoa.focus(true);
        form.add(viewPessoa);
    }
    
});
