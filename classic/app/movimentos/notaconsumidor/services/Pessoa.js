Ext.define('SamosAdmin.movimentos.notaconsumidor.services.Pessoa', {
    alternateClassName: 'NotaConsumidor.services.Pessoa',
    singleton: true,

    exibir: function() {
        const janelaPessoa = Ext.$('formnotaconsumidorpessoa')[0];

        try {
            janelaPessoa.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formnotaconsumidor')[0];
        const modelPessoa = Ext.create(
            'SamosAdmin.movimentos.notaconsumidor.form.pessoa.Model', 
        );
        const viewPessoa = Ext.create({
            xtype: 'formnotaconsumidorpessoa'
        });
        
        viewPessoa.getViewModel().set({
            model: modelPessoa,
            readOnly: false
        });

        viewPessoa.focus(true);
        form.add(viewPessoa);
    }
});
