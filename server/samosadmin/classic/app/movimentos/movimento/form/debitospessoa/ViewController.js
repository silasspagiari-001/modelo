Ext.define('SamosAdmin.movimentos.movimento.form.debitospessoa.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.formmovimentosdebitospessoa',

    onLiberarClick: function(btn, e) {
        const nivel = configs.getClientName().match(/turbotec|santana/) ? 3 : 1;
        const formMovimento = this.getView().up('formmovimentos');
        const formOrdens  = this.getView().up('formordensturbos');
        const gridItems = formMovimento ? formMovimento.lookup('produtos') : [];
        const vm = this.getViewModel();
        let idPessoa = 0;
        let nomePessoa = '';
        let corpoDebitos = '';

        if(formMovimento) {
            idPessoa  = formMovimento.model.get('MOVIMENTOS_ID_PESSOAS');
            nomePessoa = formMovimento.model.get('MOVIMENTOS_NOME');
            corpoDebitos = `Pessoa: ${idPessoa} - ${nomePessoa} com R$ ${vm.get('totalFormatado')} em débitos pendentes - Autoriza?`;
        } else {
            idPessoa  = formOrdens.model.get('ORDENS_ID_PESSOAS');
            nomePessoa = formOrdens.model.get('ORDENS_NOME');
            corpoDebitos = `Pessoa: ${idPessoa} - ${nomePessoa} com R$ ${vm.get('totalFormatado')} em débitos pendentes - Autoriza?`;
        }

        if(configs.getMovimentos().liberacaoViaSocket) {
            SamosWidgets.SolicitaSocket.solicitar({
                operadorId: `${configs.getClientName()}${configs.getUsuario().id}`,
                operadorNome: configs.getUsuario().nome,       
                titulo: 'Autorização Venda para Cliente com Débitos',           
                mensagem: 'Aguardando autorização...',
                corpo: corpoDebitos
            }).then(() => {
                this.getView().destroy();

                if(formMovimento) {
                    Ext.defer(gridItems.focarNovoItem, 200, gridItems);
                }

                SamosUtils.Request.nodeApi({
                    url: `/processos/gerarlog`,
                    method: 'POST',
                    query: {
                        senhaNivel: true,
                        log: `Venda cliente c/ débito ID:${idPessoa}`
                    }
                });
            })
            .catch(() => this.onSairClick());
        } else { // Método anterior, via senhaNivel
            Ext.create({ xtype: 'samoswidgets-senhanivel' })
            .iniciar(nivel)
            .then(() => {
                this.getView().destroy();

                if(formMovimento) {
                    Ext.defer(gridItems.focarNovoItem, 200, gridItems);
                }

                SamosUtils.Request.nodeApi({
                    url: `/processos/gerarlog`,
                    method: 'POST',
                    query: {
                        senhaNivel: true,
                        log: `Venda cliente c/ débito ID:${idPessoa}`
                    }
                });
            })
            .catch(() => this.onSairClick());
        }        
    },

    onSairClick: function() {

        if(this.getView().up('formmovimentos')) {
            this.getView().up('formmovimentos').getController().cancelar();
        } else {
            this.getView().up('formordensturbos').getController().cancelar();
        }

        this.callParent(arguments);
    }
});
