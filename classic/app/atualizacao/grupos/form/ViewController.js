Ext.define('SamosAdmin.atualizacao.grupos.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formgrupos',

    onAtualizarClick: async function (btn, e) {
        const view = this.getView();

        try {
          
            if(await SamosUtils.Msg.confirm('Deseja realmente atualizar?')) {
                view.initGauge();
                const id = this.lookup('codigo').getValue();

                await SamosUtils.Request.nodeApi({
                    url: `/processos/atualizagrupo/${id}`,
                    method: 'PUT',
                    query: {
                        log: `ATUALIZACAO GRUPO: PUT /processos/atualizagrupo/${id}`
                    },
                    data: {
                        grupo      : id,
                        markup     : cents(this.lookup('markup').getValue()),
                        margemmin  : cents(this.lookup('margemminima').getValue()),
                        comissao   : cents(this.lookup('comissao').getValue()),
                        perprazo   : cents(this.lookup('perprazo').getValue()),
                        usuario    : configs.getUsuario().id,
                        log        : SamosUtils.Info.getLog()
                    }
                });
                
                Ext.Note('success', 'Atualizado com sucesso!');
                view.stopGauge();                
            }
            
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível atualizar o grupo');
            view.stopGauge();
        }
    }
    
});
