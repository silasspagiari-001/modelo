Ext.define('SamosAdmin.atualizacao.ncms.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formncms',

    onGravarClick: function (btn, event) {
        const model = this.getRecord();
        const grids = this.getGridItems();

        grids.forEach(grid => grid.finalizarEdicao());

        this.validarCabecalho()
            .then(() => {
                Ext.Msg.confirm('Confirmação', 'Deseja realmente gravar?', btn => {
                    if (btn == 'yes') {
                        this.getView().initGauge('Gravando...');
                        this.estruturarDifal(grids, model);

                        model.save()
                            .then(record => {
                                this.onGravacaoSucesso(record)
                            })
                            .catch(this.onGravacaoFalha.bind(this))
                            .finally(this.aposGravar.bind(this));
                    }
                });
            });
    },

    estruturarDifal: function (grids, model) {
        const objDifal = grids.reduce((difal, grid) => {
            const store = grid.getStore();
            const list = store.data.items || [];

            list.forEach(uf => {
                uf.data['IVA'] = cents(uf.data['IVA'] || 0) / 100;
                uf.data['DIV'] = cents(uf.data['DIV'] || 0) / 100;
                uf.data['FCP'] = cents(uf.data['FCP'] || 0) / 100;
                uf.data['DIF'] = cents(uf.data['DIF'] || 0) / 100;
                difal.push(SamosUtils.Json.trocarAspasDuplasPorDuasSimples(uf.data));
            })

            return difal;
        }, []);

        model.set('NCMS_DIFAL', objDifal);
    }
});
