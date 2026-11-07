Ext.define('SamosAdmin.atualizacao.pessoas.form.formulafornecedor.ViewController', {
    extend: 'SamosAdmin.atualizacao.pessoas.form.ViewController',
    alias: 'controller.formpessoasformulafornecedor',

    initViewModel: function(vm) { 
        this.getView().initGauge();

        this.callParent(arguments);
        setTimeout(() => {
            const pessoa = vm.get('pessoa');
            const formula = SamosUtils.Json.parseJSON(pessoa.get('PESSOAS_FORMULA'));
            const model = Ext.create('SamosAdmin.atualizacao.pessoas.form.formulafornecedor.Model');

            if(formula){
                model.set({
                    'FORMULA_CODIGO'   : pessoa.get('PESSOAS_ID'),
                    'FORMULA_DESCONTO' : formula['desconto'],
                    'FORMULA_IPI'      : formula['ipi'],
                    'FORMULA_SEGURO'   : formula['seguro'],
                    'FORMULA_PRAZO'    : formula['prazo'],
                    'FORMULA_FRETE'    : formula['frete'],
                    'FORMULA_DESPESAS' : formula['despesas']
                });
            } else {
                model.set({
                    'FORMULA_CODIGO'   : pessoa.get('PESSOAS_ID'),
                    'FORMULA_DESCONTO' : 0,
                    'FORMULA_IPI'      : 0,
                    'FORMULA_SEGURO'   : 0,
                    'FORMULA_PRAZO'    : 0,
                    'FORMULA_FRETE'    : 0,
                    'FORMULA_DESPESAS' : 0
                });
            }

            vm.set('model', model);

            setTimeout(() => {
                this.getView().stopGauge();
            }, 300);
        }, 800); // 700
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
        this.lookup('desconto').focus(true);
    },

    onGravarClick: async function() {

        try {
            const vm = this.getViewModel();
            const model = vm.get('model');
            const pessoa = vm.get('pessoa');
    
            const formula = {
                codigo  : model.get('FORMULA_CODIGO'),
                desconto: model.get('FORMULA_DESCONTO'),
                ipi     : model.get('FORMULA_IPI'),
                seguro  : model.get('FORMULA_SEGURO'),
                prazo   : model.get('FORMULA_PRAZO'),
                frete   : model.get('FORMULA_FRETE'),
                despesas: model.get('FORMULA_DESPESAS')
            };
    
            if(await SamosUtils.Msg.confirm('Deseja realmente gravar?')) {
                this.getView().initGauge('Gravando...');

                pessoa.set('PESSOAS_FORMULA', JSON.stringify(formula));

                await pessoa.save();

                this.getView().initGauge('Atualizando produtos...');

                await this.atualizarPrecos(formula);

                this.getView().stopGauge();

                Ext.Note('success', 'Gravado com sucesso');

                this.onSairClick();
            }
        } catch(error) {
            SamosUtils.Msg.error(error, 'Não foi possível gravar os parâmetros');
        }

    },

    atualizarPrecos: async function (formula) {

        const id = formula.codigo || 0;

        try {
            await SamosUtils.Request.nodeApi({
                url: `/processos/atualizarprecos/${id}`,
                method: 'PUT',
                data: {
                    formula: formula
                }
            });            
        } catch (error) {
            SamosUtils.Msg.error(error, 'Falha ao atualizar percentuais e preços');
        }
    },

    onCancelarClick: function(btn, event) {
        this.getViewModel().set('model', undefined);
        this.cancelar();
    }
});
