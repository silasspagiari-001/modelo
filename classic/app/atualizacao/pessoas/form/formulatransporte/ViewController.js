Ext.define('SamosAdmin.atualizacao.pessoas.form.formulatransporte.ViewController', {
    extend: 'SamosAdmin.atualizacao.pessoas.form.ViewController',
    alias: 'controller.formpessoasformulatransporte',

    initViewModel: function(vm) { 
        this.getView().initGauge();

        this.callParent(arguments);
        setTimeout(() => {
            const pessoa = vm.get('pessoa');
            const formula = SamosUtils.Json.parseJSON(pessoa.get('PESSOAS_FORMULA'));
            const model = Ext.create('SamosAdmin.atualizacao.pessoas.form.formulatransporte.Model');

            if(formula){
                model.set({
                    'FORMULA_TIPO'      : formula['tipo'],
                    'FORMULA_URBANOA'   : formula['urbA'],
                    'FORMULA_URBANOB'   : formula['urbB'],
                    'FORMULA_SUBURBANOA': formula['subA'],
                    'FORMULA_SUBURBANOB': formula['subB']
                });
            } else {
                model.set({
                    'FORMULA_TIPO'      : 'percentual',
                    'FORMULA_URBANOA'   : 0,
                    'FORMULA_URBANOB'   : 0,
                    'FORMULA_SUBURBANOA': 0,
                    'FORMULA_SUBURBANOB': 0
                });
            }

            vm.set('model', model);

            setTimeout(() => {
                this.getView().stopGauge();
            }, 200);
        }, 500);
    },

    onAlterarClick: function() {
        this.getViewModel().set('readOnly', false);
        this.lookup('urbanoa').focus(true);
    },

    onGravarClick: function(btn, e) {
        const vm = this.getViewModel();
        const ctrlPessoas = this.getView().up('formpessoas').getController();
        const model = vm.get('model');
        const pessoa = vm.get('pessoa');
        const formula = {
            tipo: model.get('FORMULA_TIPO'),
            urbA: model.get('FORMULA_URBANOA'),
            subA: model.get('FORMULA_SUBURBANOA'),
            urbB: model.get('FORMULA_URBANOB'),
            subB: model.get('FORMULA_SUBURBANOB')
        };

        Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
            if (btn == 'yes') {
                this.getView().initGauge('Gravando...');

                pessoa.set('PESSOAS_FORMULA', JSON.stringify(formula));

                pessoa.save()
                    .then(ctrlPessoas.onGravacaoSucesso.bind(ctrlPessoas))
                    .catch(ctrlPessoas.onGravacaoFalha.bind(ctrlPessoas))
                    .finally(() => {
                        ctrlPessoas.aposGravar.call(ctrlPessoas);
                        this.onSairClick();
                    });
            }
        });
    },

    onCancelarClick: function(btn, event) {
        this.getViewModel().set('model', undefined);
        this.cancelar();
    }
});
