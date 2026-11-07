Ext.define('SamosAdmin.movimentos.coletas.form.ViewController', {
    extend: 'SamosModule.form.ViewController',
    alias: 'controller.formcoletas',

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getListView().title;
            await Coleta.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar nova coleta');
        }
    },

    onFotosClick: function() {
        const view = Ext.create({
            xtype: 'formcoletasfotos'
        });

        view.getViewModel().set({
            'idColeta' : this.getRecord().get('COLETAS_ID')
        });
    }

});
