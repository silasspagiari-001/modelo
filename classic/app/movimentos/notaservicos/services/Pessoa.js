Ext.define('SamosAdmin.movimentos.notaservicos.services.Pessoa', {
    alternateClassName: 'NotaServicos.services.Pessoa',
    singleton: true,

    exibir: function() {
        const janelaPessoa = Ext.$('formnotaservicospessoa')[0];

        try {
            janelaPessoa.focus();
        } catch (e) {
            this.criarJanela();
        }
    },
    
    criarJanela: function (btn, e) {
        const form = Ext.$('formnotaservicos')[0];
        const modelPessoa = Ext.create(
            'SamosAdmin.movimentos.notaservicos.form.pessoa.Model', 
        );
        const viewPessoa = Ext.create({
            xtype: 'formnotaservicospessoa'
        });
        
        viewPessoa.getViewModel().set({
            model: modelPessoa,
            readOnly: false
        });

        viewPessoa.focus(true);
        form.add(viewPessoa);
    }
});
