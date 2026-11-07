Ext.define('SamosAdmin.movimentos.romaneiosconstrucao.search.ViewController', {
    extend: 'SamosWidgets.search.ViewController',
    alias: 'controller.romaneiosconstrucaosearch',

    getBuscarParams: async function () {
        const vm = this.getViewModel();
        const nomeDocumento = this.getView().title;
        const idEmpresa = configs.getEmpresa().id;
        const documento = await Documento.services.Model.get(nomeDocumento, idEmpresa);

        return {
            empresa   : idEmpresa,
            documento : documento.get('DOCUMENTOS_ID'),
            numero    : vm.get('valueNumero'),
            transporte: vm.get('valueIdTransporte'),
            inicio    : momentTz(vm.get('valueInicio')).format('DD/MM/YYYY'),
            final     : momentTz(vm.get('valueFinal')).format('DD/MM/YYYY'),
            ordem     : vm.get('valueOrdem'),
            status    : vm.get('valueStatus')
        };
    }
});
