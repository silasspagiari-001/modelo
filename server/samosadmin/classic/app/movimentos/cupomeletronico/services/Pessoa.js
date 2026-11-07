Ext.define('SamosAdmin.movimentos.cupomeletronico.services.Pessoa', {
    alternateClassName: 'CupomEletronico.services.Pessoa',
    singleton: true,

    exibir: function() {
        const janelaPessoa = Ext.$('formcupomeletronicopessoa')[0];

        try {
            janelaPessoa.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formcupomeletronico')[0];
        const modelPessoa = Ext.create(
            'SamosAdmin.movimentos.cupomeletronico.form.pessoa.Model', 
        );
        const viewPessoa = Ext.create({
            xtype: 'formcupomeletronicopessoa'
        });
        
        viewPessoa.getViewModel().set({
            model: modelPessoa,
            readOnly: false
        });

        viewPessoa.focus(true);
        form.add(viewPessoa);
    }
});
