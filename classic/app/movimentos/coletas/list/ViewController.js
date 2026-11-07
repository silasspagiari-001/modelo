Ext.define('SamosAdmin.movimentos.coletas.list.ViewController', {
    extend: 'SamosModule.list.ViewController',
    alias: 'controller.coletas',

    onNovoClick: async function () {
        try {
            const form = await this.callParent(arguments);
            const nomeDocumento = this.getView().title;
            await Coleta.services.Model.definirValoresPadrao(form, nomeDocumento);
            return form;
        } catch(error) {
            SamosUtils.Msg.error(error, 'Falhar ao criar nova coleta');
        }
    },

    getBuscarParams: async function () {
        const vm = this.getViewModel();

        return {
            transportador: vm.get('valueIdUsuario'),
            fornecedor: vm.get('valueIdFornecedor'),
            cliente: vm.get('valueIdCliente'),
            inicio: momentTz(this.lookup('inicio').getValue()).format('DD/MM/YYYY'),
            final : momentTz(this.lookup('final').getValue()).format('DD/MM/YYYY'),
            ordem : vm.get('valueOrdem')
        };
    }

});
