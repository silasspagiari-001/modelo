Ext.define('SamosAdmin.atualizacao.pessoas.form.precos.ViewController', {
    extend: 'SamosAdmin.atualizacao.pessoas.form.ViewController',
    alias: 'controller.formpessoasprecos',

    initViewModel: function(vm) { 
        this.getView().initGauge();

        this.callParent(arguments);

        Ext.asap(() => {
            const pessoa = vm.get('pessoa');
            const formula = SamosUtils.Json.parseJSON(pessoa.get('PESSOAS_FORMULA'));

            if(formula){
                vm.set('dataPrecos', formula || [])
            }

            setTimeout(() => {
                this.getView().stopGauge();
            }, 200);
        });
    },

    onAlterarClick: function (btn, event) {
        this.setReadOnly(false);
        this.doDefaultFocus();
    },

    onGravarClick: async function(btn, e) {
        const view = this.getView();

        try {
            const grid = this.lookup('produtos');
            const pessoa = this.getViewModel().get('pessoa');
    
            grid.finalizarEdicao();
    
            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')){
                view.initGauge();

                const formula = (grid.getStore().data.items || []).map(produto => {
                    return {
                        'ID': produto.get('ID'),
                        'RS': produto.get('RS')
                    }
                });

                pessoa.set('PESSOAS_FORMULA', JSON.stringify(formula));

                await pessoa.save();

                //volta a descrição do produto pra store
                pessoa.set('PESSOAS_FORMULA', JSON.stringify((grid.getStore().data.items || []).map(produto => produto.data)));
        
                /*await SamosUtils.Request.nodeApi({
                    url: `/processos/pessoas/precosespecificos`,
                    method: 'POST',
                    data: precos
                });*/

                Ext.Note('success', 'Preços atualizados com sucesso');

                this.getView().destroy();
            }
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao salvar precos');
        }

        view.stopGauge();
    }
});
