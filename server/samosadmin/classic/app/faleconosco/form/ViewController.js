Ext.define('SamosAdmin.faleconosco.form.ViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.faleconoscoform',

    onEnviarClick: async function() {
        try {
            const vm        = this.getViewModel();
            const view      = this.getView();
            const idEmpresa = configs.getEmpresa().id || 1;
            const empresa   = await Empresa.services.Model.get(idEmpresa);
            const nome      = vm.get('nome');
            const email     = vm.get('email');
            const telefone  = vm.get('telefone');
            const cidade    = vm.get('cidade');
            const mensagem  = vm.get('mensagem');
            
            if(!nome || !email || !telefone || !cidade || !mensagem) {
                throw 'Preencha todos os campos';
            }
            
            if(!SamosUtils.String.isEmail(email)) {
                throw 'Email inválido';
            }
            
            if(await SamosUtils.Msg.confirm('Deseja realmente enviar a mensagem?')){
                view.initGauge('Enviando email...');
    
                const cabecalho = `<span align="left">
                    <h4 style="font-weight:normal">
                    Nome:     ${nome}<p>
                    Email:    ${email}<p>
                    Telefone: ${telefone}<p>
                    Cidade:   ${cidade}<p>
                </h4></span>`;
                
                await SamosUtils.Email.enviar({
                    emails:    `${empresa.get('EMPRESAS_EMAIL')},suporte@samos.com.br,lucas@samos.com.br,joaocarlos@samos.com.br,albanir@samos.com.br,lucelia@samos.com.br`,
                    assunto:   'Contato Via Fale Conosco',
                    template:  'resources/email.html',
                    cabecalho: cabecalho,
                    corpo:     vm.get('mensagem') + '<br><br>'
                });

                Ext.Note('success', 'Mensagem enviada com sucesso');
                this.onCancelarClick();
            }

        } catch(error) {
            view.stopGauge();
            SamosUtils.Msg.error(error, 'Falha ao enviar mensagem');
        }
    },

    onCancelarClick: function (btn, e) {
        this.getView().up('window').destroy();
    }
});
